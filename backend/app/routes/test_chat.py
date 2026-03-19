from fastapi import APIRouter

router = APIRouter()

@router.get("/test-chat")
def test_chat():
    return {"message": "chat router working"}