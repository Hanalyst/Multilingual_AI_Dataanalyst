from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, engine
from app.models.dataset import Dataset
from app.models.user import User
from app.models.chat_history import ChatHistory
from app.services.auth_dependency import get_current_user
from app.services.ai_engine.intent_parser import parse_intent
from app.services.ai_engine.ai_sql_generator import generate_sql_with_ai
from app.services.ai_engine.insight_generator import generate_insight_with_ai
from app.services.sql_generator import generate_sql

import pandas as pd
import io
import uuid

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/ask")
def ask_question(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question   = data.get("question", "")
    dataset_id = data.get("dataset_id")
    session_id = data.get("session_id")
    language   = data.get("language", "en")

    if not dataset_id:
        raise HTTPException(status_code=400, detail="dataset_id is required")

    # 1. Load dataset record
    dataset_record = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()

    if not dataset_record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # 2. Parse CSV from DB
    try:
        df = pd.read_csv(io.StringIO(dataset_record.file_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read CSV: {str(e)}")

    # Clean column names — strip spaces, replace special chars
    df.columns = [col.strip().replace(" ", "_").replace("-", "_") for col in df.columns]

    columns      = list(df.columns)
    column_types = {col: str(df[col].dtype) for col in df.columns}
    sample_rows  = df.head(5).to_dict(orient="records")

    # 3. Generate unique temp table name for this request
    temp_table = f"tmp_{uuid.uuid4().hex[:12]}"

    # 4. Parse intent
    intent = parse_intent(question, columns=columns, column_types=column_types)

    # 5. Generate SQL via Groq AI, fall back to rule-based
    #    Tell AI the table name is the temp table
    sql = generate_sql_with_ai(
        question=question,
        columns=columns,
        column_types=column_types,
        sample_rows=sample_rows,
        table_name=temp_table,
        language=language
    )
    if not sql:
        sql = generate_sql(intent, temp_table, columns)
    else:
        # Replace hardcoded "data" table references with actual temp table name
        import re
        sql = re.sub(r'\b"?data"?\b', f'"{temp_table}"', sql, flags=re.IGNORECASE)

    # 6. Load CSV into PostgreSQL temp table and execute SQL
    try:
        with engine.begin() as conn:
            # Write CSV data into temp table (auto-creates columns from df)
            df.to_sql(
                temp_table,
                conn,
                if_exists="replace",
                index=False,
                method="multi",
                chunksize=500
            )

            # Execute the AI-generated SQL
            result = conn.execute(text(sql))
            rows = result.fetchall()
            col_names = list(result.keys())

            # Drop temp table immediately after query
            conn.execute(text(f'DROP TABLE IF EXISTS "{temp_table}"'))

        result_df = pd.DataFrame(rows, columns=col_names)

    except Exception as e:
        # Always try to clean up temp table even on error
        try:
            with engine.begin() as conn:
                conn.execute(text(f'DROP TABLE IF EXISTS "{temp_table}"'))
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"SQL execution failed: {str(e)}")

    # 7. Build chart config
    chart_type = "bar"
    if intent.get("trend") or intent.get("date_grouping"):
        chart_type = "line"
    elif intent.get("group_by") and result_df.shape[0] <= 6:
        chart_type = "pie"

    chart_data  = None
    result_cols = list(result_df.columns)

    if len(result_cols) == 2:
        label_col  = result_cols[0]
        value_col  = result_cols[1]
        chart_data = {
            "type": chart_type,
            "labels": result_df[label_col].astype(str).tolist(),
            "datasets": [{
                "label": value_col,
                "data": [
                    round(float(v), 2) if v is not None else 0
                    for v in result_df[value_col].tolist()
                ]
            }]
        }

    # 8. Generate insight in selected language using AI
    insight = generate_insight_with_ai(
        question=question,
        sql=sql,
        df=result_df,
        language=language
    )

    # 9. Save to chat history
    try:
        if not session_id:
            session_id = str(uuid.uuid4())

        chat_entry = ChatHistory(
            session_id=uuid.UUID(session_id),
            user_id=current_user.id,
            dataset_id=uuid.UUID(str(dataset_id)),
            question=question,
            sql_query=sql,
            insight=insight,
            result_data=result_df.to_dict(orient="records"),
            chart_data=chart_data
        )
        db.add(chat_entry)
        db.commit()
    except Exception as e:
        print(f"Chat history save failed: {str(e)}")

    # 10. Return
    return {
        "question":   question,
        "sql":        sql,
        "table":      result_df.to_dict(orient="records"),
        "chart":      chart_data,
        "insight":    insight,
        "session_id": session_id
    }
