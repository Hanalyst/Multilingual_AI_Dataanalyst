from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

# Load models FIRST — order matters for SQLAlchemy mapper config
from app.models.user import User
from app.models.dataset import Dataset

from app.database import engine, Base

# Routes
from app.routes import auth
from app.routes import dataset as dataset_routes
from app.routes import upload
from app.routes import chat

from app.services.auth_dependency import get_current_user

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hanalyst API")

# ✅ CORS FIXED — cannot use "*" with allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hanalyst-frontend.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Handle OPTIONS preflight for ALL routes
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return JSONResponse(
        content="OK",
        headers={
            "Access-Control-Allow-Origin": "https://hanalyst-frontend.vercel.app",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Routers
app.include_router(auth.router)
app.include_router(dataset_routes.router)
app.include_router(upload.router)
app.include_router(chat.router)

# -----------------------------
# Basic APIs
# -----------------------------

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

# -----------------------------
# Debug: show loaded routes
# -----------------------------
print("------ ROUTES LOADED ------")
for route in app.routes:
    print(route.path)
print("---------------------------")