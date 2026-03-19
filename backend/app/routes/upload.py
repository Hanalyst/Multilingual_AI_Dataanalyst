from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.dataset import Dataset
from app.models.user import User
from app.services.auth_dependency import get_current_user
import os
import uuid

router = APIRouter()

UPLOAD_FOLDER = "uploads"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    unique_name = str(uuid.uuid4()) + "_" + file.filename
    file_path = os.path.join(UPLOAD_FOLDER, unique_name)

    try:
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save failed: {str(e)}")

    new_dataset = Dataset(
        name=file.filename,
        file_path=file_path,
        user_id=current_user.id
    )

    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return {
        "id": str(new_dataset.id),
        "name": new_dataset.name,
        "message": "Dataset uploaded successfully"
    }
