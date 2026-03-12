import os
import requests
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from dotenv import load_dotenv
from langdetect import detect
import google.generativeai as genai
from routes.chat_routes import get_current_user
from database import get_db
import models

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    sessionId: str | None = None
    role: str | None = None
    location: str = "Ranuj"

def is_greeting(text):
    greetings = ["hi", "hello", "hey", "namaste", "kem cho", "ram ram"]
    return text.lower().strip() in greetings

def detect_language(text):
    try:
        lang = detect(text)
        if lang == "hi": return "Hindi"
        if lang == "gu": return "Gujarati"
        return "English"
    except:
        return "English"

def get_weather(location):
    if not WEATHER_API_KEY: return "Weather service not configured."
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={WEATHER_API_KEY}&units=metric"
        res = requests.get(url, timeout=5)
        if res.status_code != 200: return "Weather info unavailable."
        data = res.json()
        return f"{location}: {data['main']['temp']}°C, {data['main']['humidity']}% humidity, {data['weather'][0]['description']}"
    except Exception:
        return "Weather service temporarily unavailable."

FARMER_PROMPT = """You are AgriAssist, a friendly agriculture expert for farmers.
Focus on: fertilizer issues, tools suggestion, organic/chemical alternatives, safety warnings, and weather impact. Keep language simple."""
SHOPKEEPER_PROMPT = """You are AgriAssist B2B assistant for agriculture shopkeepers.
Focus on: inventory updates, chemical/organic separation, status and advisory. Keep responses short and professional."""

def save_chat(db: Session, user_id: int, role: str, message: str, reply: str):
    new_chat = models.ChatHistory(
        user_id=user_id,
        role=role,
        message=message,
        response=reply
    )
    db.add(new_chat)
    db.commit()

def generate_with_retry(prompt):
    try:
        response = model.generate_content(prompt, request_options={"timeout": 10})
        return response.text
    except Exception:
        try:
            response = model.generate_content(prompt, request_options={"timeout": 15})
            return response.text
        except: return None

@router.post("/")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")
    role = (current_user.get("role") or request.role or "farmer").lower()
    message = request.message.strip()
    language = detect_language(message)

    if is_greeting(message):
        menu = "👨‍🌾 Welcome! 1️⃣ Detect issue 2️⃣ Fertilizer 3️⃣ Tools 4️⃣ Weather 5️⃣ History" if role == "farmer" else "🏪 Shopkeeper Panel 1️⃣ Update inventory 2️⃣ Stock limits 3️⃣ History"
        return {"role": role, "language": language, "weather": "", "reply": menu}

    weather_info = get_weather(request.location) if role == "farmer" and "weather" in message.lower() else ""
    system_prompt = FARMER_PROMPT if role == "farmer" else SHOPKEEPER_PROMPT

    import uuid
    session_id = request.sessionId or str(uuid.uuid4())

    # Get recent context from Postgres
    past_chats = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user_id).order_by(desc(models.ChatHistory.created_at)).limit(5).all()
    past_chats.reverse()
    
    history_text = "--- Recent History ---\n" + "".join([f"User: {c.message}\nYou: {c.response}\n" for c in past_chats]) + "\n" if past_chats else ""
    final_prompt = f"Role: {role}\nLanguage: {language}\nWeather: {weather_info}\n{history_text}Current Q: {message}\nRespond nicely in {language}."

    ai_reply = generate_with_retry(system_prompt + final_prompt) or "I'm sorry 🙏 I'm having trouble connecting. Try again shortly."
    save_chat(db, user_id, role, message, ai_reply)

    return {"role": role, "language": language, "weather": weather_info, "reply": ai_reply, "sessionId": session_id}
