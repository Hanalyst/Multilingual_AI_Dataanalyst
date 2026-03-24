from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.dataset import Dataset
from app.models.user import User
from app.models.chat_history import ChatHistory
from app.services.auth_dependency import get_current_user
from app.services.ai_engine.intent_parser import parse_intent
from app.services.sql_generator import generate_sql
from app.services.ai_engine.ai_sql_generator import generate_sql_with_ai
from app.services.ai_engine.insight_generator import generate_insight_with_ai
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import sqlite3
import uuid
import io

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AskRequest(BaseModel):
    question: str
    dataset_id: Optional[str] = None
    session_id: Optional[str] = None
    language: Optional[str] = "en"

@router.post("/ask")
def ask_question(
    data: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.dataset_id or data.dataset_id in ["None", "null", "", "undefined"]:
        raise HTTPException(status_code=400, detail="Please upload and select a dataset first")

    try:
        dataset_uuid = uuid.UUID(data.dataset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid dataset ID format")

    dataset_record = db.query(Dataset).filter(
        Dataset.id == dataset_uuid,
        Dataset.user_id == current_user.id
    ).first()

    if not dataset_record:
        raise HTTPException(status_code=404, detail="Dataset not found. Please upload a dataset first.")

    csv_text = dataset_record.csv_content or dataset_record.file_path
    if not csv_text:
        raise HTTPException(status_code=404, detail="Dataset content missing. Please re-upload your CSV.")

    try:
        df = pd.read_csv(io.StringIO(csv_text))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read CSV: {str(e)}")

    columns = list(df.columns)
    column_types = {col: str(df[col].dtype) for col in columns}
    table_name = "data"
    sample_rows = df.head(10).to_dict(orient="records")
    language = data.language or "en"

    sql = generate_sql_with_ai(
        question=data.question,
        columns=columns,
        column_types=column_types,
        sample_rows=sample_rows,
        dialect="sqlite",
        language=language
    )

    if not sql:
        intent = parse_intent(data.question, columns=columns, column_types=column_types)
        sql = generate_sql(intent, table_name, columns)
    else:
        intent = parse_intent(data.question, columns=columns, column_types=column_types)

    try:
        conn = sqlite3.connect(":memory:")
        df.to_sql(table_name, conn, index=False, if_exists="replace")
        result_df = pd.read_sql_query(sql, conn)
        conn.close()
    except Exception as e:
        try:
            intent = parse_intent(data.question, columns=columns, column_types=column_types)
            sql = generate_sql(intent, table_name, columns)
            conn = sqlite3.connect(":memory:")
            df.to_sql(table_name, conn, index=False, if_exists="replace")
            result_df = pd.read_sql_query(sql, conn)
            conn.close()
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Query failed: {str(e2)}")

    result_cols = list(result_df.columns)
    intent = parse_intent(data.question, columns=columns, column_types=column_types)

    chart_type = "bar"
    if intent.get("trend") or any(
        kw in data.question.lower()
        for kw in ["trend", "over time", "monthly", "by month", "by year"]
    ):
        chart_type = "line"
    elif len(result_df) <= 6 and len(result_cols) == 2:
        chart_type = "pie"

    chart_data = None
    if len(result_cols) == 2:
        label_col = result_cols[0]
        value_col = result_cols[1]
        try:
            numeric_vals = pd.to_numeric(result_df[value_col], errors="coerce")
            chart_data = {
                "type": chart_type,
                "labels": result_df[label_col].astype(str).tolist(),
                "datasets": [{"label": value_col, "data": numeric_vals.round(2).tolist()}]
            }
        except Exception:
            chart_data = None

    insight = generate_insight_with_ai(data.question, sql, result_df, language=language)
    table_data = result_df.to_dict(orient="records")

    session_id = uuid.UUID(data.session_id) if data.session_id and data.session_id not in ["None", "null"] else uuid.uuid4()

    try:
        chat_record = ChatHistory(
            session_id=session_id,
            user_id=current_user.id,
            dataset_id=dataset_uuid,
            question=data.question,
            sql_query=sql,
            insight=insight,
            result_data=table_data,
            chart_data=chart_data
        )
        db.add(chat_record)
        db.commit()
    except Exception as e:
        print(f"Warning: Could not save chat history: {e}")

    return {
        "question": data.question,
        "sql": sql,
        "table": table_data,
        "chart": chart_data,
        "insight": insight,
        "session_id": str(session_id)
    }
