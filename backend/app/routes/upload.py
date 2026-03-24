from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.dataset import Dataset
from app.models.user import User
from app.services.auth_dependency import get_current_user

router = APIRouter()

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

    try:
        content = await file.read()
        csv_content = content.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File read failed: {str(e)}")

    new_dataset = Dataset(
        name=file.filename,
        csv_content=csv_content,
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
