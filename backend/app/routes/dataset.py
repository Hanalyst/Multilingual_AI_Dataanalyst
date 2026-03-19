from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, engine
from app.models.dataset import Dataset
from app.models.user import User
from app.services.auth_dependency import get_current_user
from app.schemas.dataset_schema import DatasetResponse
import os
import uuid

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/my-datasets", response_model=list[DatasetResponse])
def get_my_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Dataset).filter(
        Dataset.user_id == current_user.id
    ).order_by(Dataset.created_at.desc()).all()

@router.delete("/datasets/{dataset_id}")
def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        dataset_uuid = uuid.UUID(dataset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid dataset ID format")

    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_uuid,
        Dataset.user_id == current_user.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Nullify dataset_id in chat_history (requires nullable column)
    with engine.connect() as conn:
        conn.execute(
            text("UPDATE chat_history SET dataset_id = NULL WHERE dataset_id = :did"),
            {"did": str(dataset_uuid)}
        )
        conn.commit()

    # Delete file from disk
    try:
        if dataset.file_path and os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
    except Exception as e:
        print(f"Warning: Could not delete file: {e}")

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}
