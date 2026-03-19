from fastapi import APIRouter, Depends
from app.models.user import User
from app.services.auth_dependency import get_current_user
from app.services.ai_engine.insight_generator import client
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"

LANGUAGE_NAMES = {
    "en": "English", "ta": "Tamil", "hi": "Hindi", "te": "Telugu",
    "kn": "Kannada", "ml": "Malayalam", "bn": "Bengali", "gu": "Gujarati",
    "pa": "Punjabi", "ar": "Arabic", "fr": "French", "de": "German",
    "ja": "Japanese", "zh": "Chinese"
}

@router.post("/chat")
def general_chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    lang_name = LANGUAGE_NAMES.get(data.language, "English")
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are Hanalyst, a friendly AI data analyst assistant. "
                        f"You help users analyze their datasets and also chat naturally. "
                        f"Respond in {lang_name} language. "
                        f"Keep responses concise and helpful. "
                        f"If asked about data analysis, encourage the user to upload a dataset and ask questions about it."
                    )
                },
                {"role": "user", "content": data.message}
            ],
            temperature=0.7,
            max_tokens=300
        )
        return {"reply": response.choices[0].message.content.strip()}
    except Exception as e:
        return {"reply": "I am here to help! Please ask me anything or upload a dataset to analyze."}
