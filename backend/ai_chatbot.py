import os
import requests
from datetime import datetime
from fastapi import APIRouter, Depends, File, UploadFile
import base64
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, text, or_
from dotenv import load_dotenv
from langdetect import detect
from routes.chat_routes import get_current_user
from database import get_db
import models
import json
from openai import OpenAI
import re
from services.weather_service import get_weather

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    MODEL_NAME = "gpt-4o-mini"
else:
    openai_client = None

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    sessionId: str | None = None
    role: str | None = None
    location: str | None = None # Explicit city from frontend
    imageBase64: str | None = None
    imageMimeType: str | None = None

# --- ELITE PIPELINE UTILITIES ---

def detect_language(text):
    try:
        lang = detect(text)
        if lang == "hi": return "Hindi"
        if lang == "gu": return "Gujarati"
        return "English"
    except:
        return "English"

def extract_keywords(message: str):
    """Extract and normalize keywords from the message."""
    cleaned = re.sub(r'[^\w\s]', '', message.lower())
    ignore_words = {"the", "a", "an", "is", "are", "of", "to", "for", "with", "my", "your", "what", "how", "do", "i", "can", "tell", "me", "show", "me", "about", "should", "shouldn", "use", "in", "at", "on"}
    words = cleaned.strip().split()
    keywords = [w for w in words if w not in ignore_words and len(w) > 2]
    return keywords

def extract_city(message: str, default_location: str = "Ranuj"):
    """
    Extract city name from message or fallback to default.
    Example: 'Weather in Ahmedabad' -> 'Ahmedabad'
    """
    msg = message.lower()
    # Improved regex to catch city names more reliably
    match = re.search(r'(?:in|at|for|of|near|weather in)\s+([a-zA-Z]+)', msg)
    if match:
        city = match.group(1).strip().capitalize()
        # Basic check to avoid common words being caught as cities
        if city.lower() not in ["the", "this", "that", "today", "tomorrow", "is", "his"]:
            return city
    return default_location

def rank_results(results, keywords):
    """Rank results by keyword match count."""
    ranked = []
    for item in results:
        score = 0
        searchable_text = ""
        if hasattr(item, "symptoms"): searchable_text += f" {item.symptoms or ''}"
        if hasattr(item, "deficiency_name"): searchable_text += f" {item.deficiency_name or ''}"
        if hasattr(item, "fertilizer_name"): searchable_text += f" {item.fertilizer_name or ''}"
        if hasattr(item, "pest_name"): searchable_text += f" {item.pest_name or ''}"
        if hasattr(item, "tool_name"): searchable_text += f" {item.tool_name or ''}"
        if hasattr(item, "product_name"): searchable_text += f" {item.product_name or ''}"
        if hasattr(item, "description"): searchable_text += f" {item.description or ''}"
        
        searchable_text = searchable_text.lower()
        for kw in keywords:
            if kw in searchable_text:
                score += 1
        ranked.append((score, item))
    
    ranked.sort(key=lambda x: x[0], reverse=True)
    return [x[1] for x in ranked]

# --- SMART QUERY ENGINE ---

def search_soil_issues(db: Session, keywords: list):
    if not keywords: return []
    query_filters = []
    for kw in keywords:
        query_filters.append(models.SoilIssue.symptoms.ilike(f"%{kw}%"))
        query_filters.append(models.SoilIssue.deficiency_name.ilike(f"%{kw}%"))
    res = db.query(models.SoilIssue).filter(or_(*query_filters)).limit(10).all()
    return rank_results(res, keywords)[:5]

def search_fertilizers(db: Session, keywords: list):
    if not keywords: return []
    query_filters = []
    for kw in keywords:
        query_filters.append(models.FertilizerKnowledge.plant_name.ilike(f"%{kw}%"))
        query_filters.append(models.FertilizerKnowledge.fertilizer_name.ilike(f"%{kw}%"))
        query_filters.append(models.FertilizerKnowledge.issue.ilike(f"%{kw}%"))
    res = db.query(models.FertilizerKnowledge).filter(or_(*query_filters)).limit(10).all()
    return rank_results(res, keywords)[:5]

def search_pesticides(db: Session, keywords: list):
    if not keywords: return []
    query_filters = []
    for kw in keywords:
        query_filters.append(models.PesticideKnowledge.crop_name.ilike(f"%{kw}%"))
        query_filters.append(models.PesticideKnowledge.pest_name.ilike(f"%{kw}%"))
    res = db.query(models.PesticideKnowledge).filter(or_(*query_filters)).limit(10).all()
    return rank_results(res, keywords)[:5]

def search_tools(db: Session, keywords: list):
    if not keywords: return []
    query_filters = []
    for kw in keywords:
        query_filters.append(models.Tool.tool_name.ilike(f"%{kw}%"))
        query_filters.append(models.Tool.recommended_crop.ilike(f"%{kw}%"))
    res = db.query(models.Tool).filter(or_(*query_filters)).limit(10).all()
    return rank_results(res, keywords)[:5]

def search_products(db: Session, keywords: list):
    if not keywords: return []
    query_filters = []
    for kw in keywords:
        query_filters.append(models.Product.product_name.ilike(f"%{kw}%"))
    res = db.query(models.Product).filter(models.Product.availability == True).filter(or_(*query_filters)).limit(10).all()
    return rank_results(res, keywords)[:5]

# --- PIPELINE COMPONENTS ---

async def detect_intent_hybrid(message: str, role: str):
    msg = message.lower()
    # 1. Weather Intent detection
    if any(k in msg for k in ["weather", "rain", "temperature", "forecast", "climate", "hot", "cold"]):
        return "weather"
    
    # 2. Existing Intents
    if any(k in msg for k in ["yellow", "brown", "spot", "growth", "leaf", "leaves"]): return "soil_issue"
    if any(k in msg for k in ["fertilizer", "urea", "dap", "organic", "manure"]): return "fertilizer"
    if any(k in msg for k in ["pest", "bug", "insect", "spray", "pesticide"]): return "pesticide"
    if any(k in msg for k in ["tool", "tractor", "plow", "sprayer", "equipment"]): return "tools"
    if any(k in msg for k in ["price", "buy", "stock", "product", "shop"]): return "product"
    if any(k in msg for k in ["remind", "reminder", "set", "alert"]): return "reminder"
    if any(k in msg for k in ["advisory", "notice", "send"]): return "advisory"
    if any(k in msg for k in ["can i spray", "should i spray", "spray today", "apply pesticide"]): return "weather_decision"

    if not openai_client: return "general_question"
    try:
        resp = openai_client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": f"Classify intent (weather, soil_issue, fertilizer, pesticide, tools, product, reminder, advisory, general_question). Role: {role}. Message: \"{message}\". Return ONLY intent."}],
            max_tokens=10
        )
        return resp.choices[0].message.content.strip().lower()
    except:
        return "general_question"

def build_strict_context(db_data: dict, weather_data: dict = None):
    """
    Build a strictly formatted context string for the AI including Weather.
    """
    context = ""
    
    # 1. Weather Context
    if weather_data:
        context += f"""
Current Weather Information:
Location: {weather_data.get('city', 'Unknown')}
Temperature: {weather_data.get('temperature', 'N/A')}°C
Humidity: {weather_data.get('humidity', 'N/A')}%
Condition: {weather_data.get('description', 'N/A')}
"""
        
        # Weather Impacts
        impacts = []
        humidity = weather_data.get('humidity')
        temp = weather_data.get('temperature')
        desc = weather_data.get('description', '').lower()

        if humidity and humidity > 65:
            impacts.append("- High humidity may increase fungal disease risk.")
        if "rain" in desc:
            impacts.append("- Rain detected: Avoid pesticide spraying or fertilizer broadcasting today.")
        if temp and temp > 35:
            impacts.append("- High heat: Ensure proper irrigation to avoid crop stress.")
            
        if impacts:
            context += "\nWeather Impacts on Farming:\n" + "\n".join(impacts) + "\n"
        context += "-" * 20 + "\n"

    # 2. Database Content
    if db_data:
        db_text = json.dumps(db_data, default=str)
        if db_text != "{}":
            context += f"\nDatabase Knowledge:\n{db_text}\n"

    return context if context else "No specific database or weather records found."

def get_conversation_memory(db: Session, session_id: str):
    messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(desc(models.ChatMessage.timestamp)).limit(5).all()
    memory = []
    for msg in reversed(messages):
        memory.append({"role": "user" if msg.sender == "user" else "assistant", "content": msg.message})
    return memory

# --- MAIN CHAT LOGIC ---

@router.post("")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user_id = current_user.get("user_id")
        user_record = db.query(models.User).filter(models.User.id == user_id).first()
        
        role = (request.role or user_record.role or "farmer").lower()
        session_id = request.sessionId or f"sess_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        user_msg = request.message.strip()
        keywords = extract_keywords(user_msg)
        
        # Extract location/city
        city = request.location or extract_city(user_msg, user_record.location or "Ranuj")
        
        session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
        if not session:
            session = models.ChatSession(id=session_id, user_id=user_id, role=role, title=user_msg[:50])
            db.add(session)
            db.commit()

        # 1. Pipeline execution
        intent = await detect_intent_hybrid(user_msg, role)
        
        # --- STEP 2: FIX INTENT HANDLING ---
        if "spray" in user_msg.lower() or "can i" in user_msg.lower():
            intent = "weather_decision"
            
        print("Intent:", intent)
        print("Keywords:", keywords)
        
        # 2. Weather Fetching
        weather_data = None
        # --- STEP 6: WEATHER-FIRST LOGIC ---
        if intent in ["weather", "weather_decision"] or any(k in user_msg.lower() for k in ["weather", "rain", "temperature", "spray"]):
            weather_data = get_weather(city)
            print("Weather Data:", weather_data)
            if not weather_data and intent == "weather_decision":
                return {"reply": "Unable to fetch weather data. Please try again.", "sessionId": session_id, "intent": intent}

        # 3. Database Querying
        db_results = {}
        # SKIP DB if weather_decision (Step 2 & 6)
        if intent != "weather_decision":
            if intent == "soil_issue" or any(k in user_msg.lower() for k in ["yellow", "leaf", "symptom"]):
                db_results["soil_issues"] = search_soil_issues(db, keywords)
            if intent == "fertilizer": db_results["fertilizers"] = search_fertilizers(db, keywords)
            if intent == "pesticide": db_results["pesticides"] = search_pesticides(db, keywords)
            if intent == "tools": db_results["tools"] = search_tools(db, keywords)
            if intent == "product": db_results["products"] = search_products(db, keywords)
        
        print("DB Data:", db_results)

        # 4. Context Builder (Step 3: Safe Context Creation)
        context_str = build_strict_context(db_results, weather_data)
        memory = get_conversation_memory(db, session_id)
        
        # 5. OpenAI Reasoning (Step 4: Wrap AI call)
        response_text = ""
        try:
            if openai_client:
                system_prompt = f"""
                You are an Expert Agriculture Decision Engine.
                
                REAL-TIME CONTEXT:
                {context_str}
                
                STRICT GUIDELINES:
                - Use the weather data to guide farming decisions (spraying, watering, harvesting).
                - Use ONLY database data for product/problem solutions.
                - If specific data is missing, provide general advisory based on provided weather.
                - Explain WHAT the farmer should do based on the current weather impacts.
                - Keep responses professional, helpful and concise.
                """
                
                messages = [{"role": "system", "content": system_prompt}]
                messages.extend(memory)
                messages.append({"role": "user", "content": user_msg})
                
                resp = openai_client.chat.completions.create(model=MODEL_NAME, messages=messages, max_tokens=800)
                response_text = resp.choices[0].message.content.strip()
            else:
                raise Exception("OpenAI client not initialized")
        except Exception as ai_err:
            print("AI ERROR:", str(ai_err))
            # STEP 5 & 7: REMOVE GENERIC FAILURE & PROVIDE MEANINGFUL FALLBACK
            if weather_data:
                desc = weather_data.get('description', 'N/A').lower()
                temp = weather_data.get('temperature', 'N/A')
                hum = weather_data.get('humidity', 'N/A')
                
                response_text = f"Based on current weather conditions in {city} ({desc}, {temp}°C, {hum}% humidity), "
                
                if "rain" in desc:
                    response_text += "it is not recommended to spray pesticide today as rain will wash it away. Please wait for dry weather."
                elif hum != 'N/A' and hum > 80:
                    response_text += "humidity is very high, increasing fungal risk. It is better to avoid spraying today."
                else:
                    response_text += "conditions seem stable, but ensure there is no strong wind before applying any pesticide."
            else:
                response_text = "I'm having trouble connecting to my advanced reasoning engine, but for best results, ensure your crops have balanced nutrients and monitor for any sudden changes in leaf color."

        # 6. Persistence
        db.add(models.ChatMessage(session_id=session_id, sender="user", message=user_msg, intent=intent))
        
        # Store combined context for audit trail
        audit_context = {
            "db_results": json.loads(json.dumps(db_results, default=str)),
            "weather": weather_data
        }
        db.add(models.ChatMessage(session_id=session_id, sender="ai", message=response_text, context_used=audit_context, intent=intent))
        db.commit()

        # STEP 7: FINAL RESPONSE FORMAT
        return {
            "reply": response_text, 
            "sessionId": session_id, 
            "intent": intent, 
            "context_used": audit_context, 
            "weather": weather_data,
            "chat_saved": True
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Chat Fatal Error: {e}")
        return {"reply": "Server error", "error": str(e)}

@router.post("/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...), current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not openai_client: return {"error": "AI service offline"}
    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        v_resp = openai_client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": [{"type": "text", "text": "Analyze crop problem."}, {"type": "image_url", "image_url": {"url": f"data:{file.content_type};base64,{base64_image}"}}]}],
            response_format={"type": "json_object"}
        )
        vision_data = json.loads(v_resp.choices[0].message.content)
        keywords = extract_keywords(f"{vision_data.get('crop')} {vision_data.get('problem')}")
        db_results = {"soil_issues": search_soil_issues(db, keywords), "fertilizers": search_fertilizers(db, keywords)}
        return {"analysis": vision_data, "database_context": db_results}
    except Exception as e:
        return {"error": str(e)}
