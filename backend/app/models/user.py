from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String)
    email           = Column(String, unique=True)
    hashed_password = Column(String)

    datasets = relationship("Dataset", back_populates="user")
    chats    = relationship("ChatHistory", back_populates="user")
