from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.chat_history import ChatHistory
from app.models.user import User
from app.services.auth_dependency import get_current_user
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/my-chats")
def get_my_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chats = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).order_by(ChatHistory.created_at.asc()).all()

    sessions = {}
    for chat in chats:
        sid = str(chat.session_id)
        if sid not in sessions:
            sessions[sid] = {
                "session_id": sid,
                "title": chat.question,
                "custom_title": None,
                "created_at": chat.created_at.isoformat(),
                "dataset_id": str(chat.dataset_id),
                "messages": []
            }
        sessions[sid]["messages"].append({
            "id": str(chat.id),
            "question": chat.question,
            "sql_query": chat.sql_query,
            "insight": chat.insight,
            "result_data": chat.result_data,
            "chart_data": chat.chart_data,
            "created_at": chat.created_at.isoformat()
        })

    session_list = sorted(
        sessions.values(),
        key=lambda x: x["created_at"],
        reverse=True
    )
    return session_list


class RenameRequest(BaseModel):
    title: str

@router.patch("/my-chats/{session_id}/rename")
def rename_session(
    session_id: str,
    body: RenameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chats = db.query(ChatHistory).filter(
        ChatHistory.session_id == uuid.UUID(session_id),
        ChatHistory.user_id == current_user.id
    ).all()

    if not chats:
        raise HTTPException(status_code=404, detail="Session not found")

    # Store custom title in the first message
    first = min(chats, key=lambda c: c.created_at)
    first.question = body.title
    db.commit()

    return {"message": "Renamed", "title": body.title}


@router.delete("/my-chats/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted = db.query(ChatHistory).filter(
        ChatHistory.session_id == uuid.UUID(session_id),
        ChatHistory.user_id == current_user.id
    ).delete()

    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")

    db.commit()
    return {"message": "Session deleted"}
