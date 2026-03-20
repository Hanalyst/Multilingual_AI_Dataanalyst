from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

class DatasetResponse(BaseModel):
    id: str
    name: str
    created_at: Optional[datetime] = None
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=str(obj.id),
            name=obj.name,
            created_at=obj.created_at,
            user_id=obj.user_id
        )
