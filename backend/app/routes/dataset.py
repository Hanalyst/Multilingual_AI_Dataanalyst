from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, engine
from app.models.dataset import Dataset
from app.models.chat_history import ChatHistory
from app.models.user import User
from app.services.auth_dependency import get_current_user
from app.schemas.dataset_schema import DatasetResponse
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

    try:
        # Step 1 — Nullify dataset_id in chat_history first (breaks FK reference)
        db.query(ChatHistory).filter(
            ChatHistory.dataset_id == dataset_uuid
        ).update({"dataset_id": None}, synchronize_session="fetch")

        # Step 2 — Now safe to delete the dataset
        db.delete(dataset)

        # Step 3 — Commit both together
        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Could not delete dataset: {str(e)}")

    return {"message": "Dataset deleted successfully"}
