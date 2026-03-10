import os
import logging
import requests
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from langdetect import detect
import google.generativeai as genai
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from routes.chat_routes import get_current_user

# -----------------------------
# LOAD ENV VARIABLES
# -----------------------------
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET")

# -----------------------------
# LOGGING SETUP
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not GEMINI_API_KEY:
    logger.critical("❌ STARTUP ERROR: GEMINI_API_KEY missing in .env")
    os._exit(1)

if not MONGO_URI:
    logger.critical("❌ STARTUP ERROR: MONGO_URI missing in .env")
    os._exit(1)

# -----------------------------
# DATABASE CONNECTION
# -----------------------------
client = AsyncIOMotorClient(MONGO_URI)
db = client["agriassist_db"]
users_collection = db["users"]
chat_collection = db["chat_history"]

# -----------------------------
# GEMINI CONFIG
# -----------------------------
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

router = APIRouter()

# -----------------------------
# REQUEST MODEL
# -----------------------------
class ChatRequest(BaseModel):
    message: str
    role: str | None = None
    location: str = "Ranuj"


# (verify_token removed since we use global get_current_user from chat_routes)


# -----------------------------
# GREETING DETECTION
# -----------------------------
def is_greeting(text):
    greetings = ["hi", "hello", "hey", "namaste", "kem cho", "ram ram"]
    return text.lower().strip() in greetings


# -----------------------------
# LANGUAGE DETECTION
# -----------------------------
def detect_language(text):
    try:
        lang = detect(text)
        if lang == "hi":
            return "Hindi"
        elif lang == "gu":
            return "Gujarati"
        else:
            return "English"
    except:
        return "English"


# -----------------------------
# WEATHER FUNCTION
# -----------------------------
def get_weather(location):
    if not WEATHER_API_KEY:
        return "Weather service not configured."

    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={WEATHER_API_KEY}&units=metric"
        response = requests.get(url, timeout=5)

        if response.status_code != 200:
            return "Weather info unavailable."

        data = response.json()
        temp = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        desc = data["weather"][0]["description"]

        return f"{location}: {temp}°C, {humidity}% humidity, {desc}"

    except Exception as e:
        logger.error(f"Weather Error: {e}")
        return "Weather service temporarily unavailable."


# -----------------------------
# SYSTEM PROMPTS
# -----------------------------
FARMER_PROMPT = """
You are AgriAssist, a friendly agriculture expert for farmers.

Focus on:
- Detect fertilizer issues in soil
- How to use fertilizer properly
- Suggest agriculture tools and purchase sources
- Alternative fertilizers (organic/homemade)
- Pesticide advice (chemical & organic)
- Safety warnings
- Weather impact

Explain clearly in simple human language.
Provide step-by-step guidance.
"""

SHOPKEEPER_PROMPT = """
You are AgriAssist B2B assistant for agriculture shopkeepers.

Focus on:
- Inventory updates
- Chemical & Organic product listing separation
- Yes/No stock availability
- Business advisory

Keep responses short and professional.
"""


# -----------------------------
# SAVE CHAT TO MONGODB
# -----------------------------
async def save_chat(user_id, role, message, reply):
    await chat_collection.insert_one({
        "userId": user_id,
        "role": role,
        "message": message,
        "reply": reply,
        "timestamp": datetime.utcnow()
    })


# -----------------------------
# RETRY WRAPPER FOR GEMINI
# -----------------------------
def generate_with_retry(prompt):
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 500
            },
            request_options={"timeout": 10}
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini First Attempt Failed (Timeout or API Error): {e}")
        try:
            logger.info("Retrying Gemini API call...")
            response = model.generate_content(
                prompt,
                request_options={"timeout": 15}
            )
            return response.text
        except Exception as e2:
            logger.error(f"Gemini Retry Failed: {e2}")
            return None


# -----------------------------
# MAIN CHAT ENDPOINT
# -----------------------------
@router.post("/")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):

    user_data = current_user
    user_id = user_data.get("user_id")
    
    # Priority: token role > request role
    raw_role = user_data.get("role") or request.role or "farmer"
    role = raw_role.lower()
    
    message = request.message.strip()

    language = detect_language(message)

    # Greeting Menu
    if is_greeting(message):
        if role == "farmer":
            return {
                "reply": """
👨‍🌾 Welcome to AgriAssist!

1️⃣ Detect fertilizer issue  
2️⃣ How to use fertilizer  
3️⃣ Tools recommendation  
4️⃣ Alternative fertilizers  
5️⃣ Pesticide advice  
6️⃣ Weather info  
7️⃣ Reminder  
8️⃣ Chat history
"""
            }
        else:
            return {
                "reply": """
🏪 Shopkeeper Panel

1️⃣ Update inventory  
2️⃣ Separate chemical/organic list  
3️⃣ Mark stock availability (Yes/No)  
4️⃣ Advisory  
5️⃣ Chat history
"""
            }

    weather_info = ""
    if role == "farmer" and "weather" in message.lower():
        weather_info = get_weather(request.location)

    system_prompt = FARMER_PROMPT if role == "farmer" else SHOPKEEPER_PROMPT

    # Fetch recent history to provide conversational context
    cursor = chat_collection.find({"userId": user_id}).sort("timestamp", -1).limit(5)
    past_chats = await cursor.to_list(length=5)
    past_chats.reverse()
    
    history_text = ""
    if past_chats:
        history_text = "--- Recent Conversation History ---\n"
        for c in past_chats:
            history_text += f"User: {c['message']}\nYou: {c['reply']}\n"
        history_text += "-----------------------------------\n\n"

    final_prompt = f"""
Role: {role}
Language: {language}
Weather: {weather_info}

{history_text}Current User Question:
{message}

Please respond conversationally and naturally in {language}, strictly using the context above if they ask a follow-up question. Be friendly and human-like!
"""

    ai_reply = generate_with_retry(system_prompt + final_prompt)

    if not ai_reply:
        ai_reply = "I'm sorry 🙏 I'm having trouble connecting to the AI service. Please try again shortly."

    await save_chat(user_id, role, message, ai_reply)

    return {
        "role": role,
        "language": language,
        "weather": weather_info,
        "reply": ai_reply
    }


# -----------------------------
# GET CHAT HISTORY ENDPOINT
# -----------------------------
@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")

    cursor = chat_collection.find({"userId": user_id}).sort("timestamp", 1)
    chats = await cursor.to_list(length=100)
    
    formatted_chats = []
    for chat in chats:
        formatted_chats.append({
            "id": str(chat["_id"]),
            "role": chat.get("role", "farmer"),
            "message": chat.get("message", ""),
            "reply": chat.get("reply", ""),
            "timestamp": chat.get("timestamp").isoformat() if chat.get("timestamp") else None
        })
        
    return {"history": formatted_chats}


# -----------------------------
# DELETE CHAT HISTORY ENDPOINT
# -----------------------------
@router.delete("/history")
async def clear_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    
    result = await chat_collection.delete_many({"userId": user_id})
    return {"message": "History cleared", "deleted_count": result.deleted_count}