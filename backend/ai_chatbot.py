import os
import requests
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from langdetect import detect
import google.generativeai as genai
from motor.motor_asyncio import AsyncIOMotorClient
from routes.chat_routes import get_current_user

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/agriassist")

client = AsyncIOMotorClient(MONGO_URI)
db = client["agriassist"]
chat_collection = db["chat_histories"]

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

async def save_chat(user_id, session_id, role, message, reply):
    await chat_collection.insert_one({
        "userId": user_id,
        "sessionId": session_id,
        "role": role,
        "message": message,
        "reply": reply,
        "timestamp": datetime.utcnow()
    })

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
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
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

    cursor = chat_collection.find({"userId": user_id, "sessionId": session_id}).sort("timestamp", -1).limit(5)
    past_chats = await cursor.to_list(length=5)
    
    history_text = "--- Recent History ---\n" + "".join([f"User: {c['message']}\nYou: {c['reply']}\n" for c in reversed(past_chats)]) + "\n" if past_chats else ""
    final_prompt = f"Role: {role}\nLanguage: {language}\nWeather: {weather_info}\n{history_text}Current Q: {message}\nRespond nicely in {language}."

    ai_reply = generate_with_retry(system_prompt + final_prompt) or "I'm sorry 🙏 I'm having trouble connecting. Try again shortly."
    await save_chat(user_id, session_id, role, message, ai_reply)

    return {"role": role, "language": language, "weather": weather_info, "reply": ai_reply, "sessionId": session_id}
