from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

class DatasetResponse(BaseModel):
    id: uuid.UUID
    name: str
    file_path: str
    created_at: Optional[datetime] = None
    user_id: Optional[int] = None

    class Config:
        from_attributes = True
