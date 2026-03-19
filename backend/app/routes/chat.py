from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.dataset import Dataset
from app.models.user import User
from app.services.auth_dependency import get_current_user
from app.services.ai_engine.intent_parser import parse_intent
from app.services.sql_generator import generate_sql

import pandas as pd
import sqlite3
import io

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

    if not dataset_id:
        raise HTTPException(status_code=400, detail="dataset_id is required")

    dataset_record = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()

    if not dataset_record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = pd.read_csv(io.StringIO(dataset_record.file_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read CSV: {str(e)}")

    columns = list(df.columns)
    table_name = "data"

    intent = parse_intent(question)
    sql = generate_sql(intent, table_name, columns)

    try:
        conn = sqlite3.connect(":memory:")
        df.to_sql(table_name, conn, index=False, if_exists="replace")
        result_df = pd.read_sql_query(sql, conn)
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL execution failed: {str(e)}")

    chart_type = "bar"
    if intent.get("trend") or intent.get("date_grouping"):
        chart_type = "line"
    elif intent.get("group_by") and result_df.shape[0] <= 6:
        chart_type = "pie"

    chart_data = None
    result_cols = list(result_df.columns)

    if len(result_cols) == 2:
        label_col  = result_cols[0]
        value_col  = result_cols[1]
        chart_data = {
            "type": chart_type,
            "labels": result_df[label_col].astype(str).tolist(),
            "datasets": [{
                "label": value_col,
                "data": result_df[value_col].round(2).tolist()
            }]
        }

    insight = build_insight(intent, result_df)

    return {
        "question": question,
        "sql": sql,
        "table": result_df.to_dict(orient="records"),
        "chart": chart_data,
        "insight": insight
    }


def build_insight(intent: dict, df: pd.DataFrame) -> str:
    if df.empty:
        return "No data found for your query."

    cols = list(df.columns)

    if len(cols) == 1:
        val = df.iloc[0, 0]
        return f"The result is {round(float(val), 2) if isinstance(val, float) else val}."

    if len(cols) == 2:
        label_col = cols[0]
        value_col = cols[1]
        top_row   = df.iloc[0]
        top_label = top_row[label_col]
        top_value = top_row[value_col]
        metric = intent.get("metric", "value")
        agg    = intent.get("aggregation", "sum")
        return (
            f"The highest {agg} of {metric} is from '"
            f"{top_label}' with a value of {round(float(top_value), 2)}. "
            f"Total of {len(df)} groups found."
        )

    return f"Query returned {len(df)} rows and {len(cols)} columns."
