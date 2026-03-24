from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import os
import uvicorn

from app.models.user import User
from app.models.dataset import Dataset

from app.database import engine, Base

from app.routes import auth
from app.routes import dataset as dataset_routes
from app.routes import upload
from app.routes import chat

from app.services.auth_dependency import get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hanalyst API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://multilingual-ai-dataanalyst.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dataset_routes.router)
app.include_router(upload.router)
app.include_router(chat.router)

@app.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

@app.get("/health")
def health():
    return {"status": "Hanalyst backend running"}

@app.get("/db-check")
def db_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {
            "db_status": "connected",
            "result": result.scalar()
        }

print("------ ROUTES LOADED ------")
for route in app.routes:
    print(route.path)
print("---------------------------")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
