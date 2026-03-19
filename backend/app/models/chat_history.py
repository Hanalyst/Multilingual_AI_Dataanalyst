from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID, JSON

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=True)
    question = Column(Text, nullable=False)
    sql_query = Column(Text)
    insight = Column(Text)
    result_data = Column(JSON)
    chart_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    dataset = relationship("Dataset", back_populates="chats")

