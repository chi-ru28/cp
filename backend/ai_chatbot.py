import os
import requests
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from dotenv import load_dotenv
from langdetect import detect
from routes.chat_routes import get_current_user
from database import get_db
import models

import google.generativeai as genai
import json

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Using gemini-2.5-flash for expert reasoning
    model_ai = genai.GenerativeModel('models/gemini-2.5-flash')
else:
    model_ai = None

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    sessionId: str | None = None
    role: str | None = None
    location: str = "Ranuj"

def is_greeting(msg):
    greetings = ["hi", "hello", "hey", "namaste", "kem cho", "ram ram"]
    return msg.lower().strip() in greetings

def detect_language(text):
    try:
        lang = detect(text)
        if lang == "hi": return "Hindi"
        if lang == "gu": return "Gujarati"
        return "English"
    except:
        return "English"

def save_chat(db: Session, user_id: str, message: str, response: str, intent: str = "query", language: str = "en", session_id: str = "main"):
    new_chat = models.ChatHistory(
        user_id=user_id,
        session_id=session_id,
        message=message,
        response=response,
        intent=intent,
        language=language
    )
    db.add(new_chat)
    db.commit()

def save_crop_analysis(db: Session, user_id: str, analysis_data: dict, crop_name: str = None):
    new_analysis = models.CropIssueReport(
        farmer_id=user_id,
        crop_name=crop_name or analysis_data.get("crop"),
        issue_description=analysis_data.get("issue"),
        detected_problem=analysis_data.get("diagnosis", analysis_data.get("Diagnosis")),
        recommended_fertilizer=analysis_data.get("solution", analysis_data.get("Recommended Fertilizer")),
        organic_solution=analysis_data.get("organic_alternative", analysis_data.get("Organic Alternative")),
        chemical_solution=analysis_data.get("solution"),
        reference_link=analysis_data.get("precaution")
    )
    db.add(new_analysis)
    db.commit()
    return new_analysis

async def get_ai_entities(message: str):
    """Use Gemini to extract crop and symptom info."""
    if not model_ai:
        return {"crop": None, "symptom": None, "intent": "general"}
    
    prompt = f"""
    You are an agriculture NLP engine. Extract the following from the farmer's message:
    - crop (the plant name)
    - symptom (the physical problem described)
    - intent (one of: soil_deficiency, pesticide, tool_query, general)

    Message: "{message}"

    Return ONLY a valid JSON object.
    Example: {{"crop": "wheat", "symptom": "yellow leaves", "intent": "soil_deficiency"}}
    """
    try:
        print(f"DEBUG: calling generate_content with model {model_ai.model_name}")
        response = model_ai.generate_content(prompt)
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"get_ai_entities FAILED: {e}")
        return {"crop": None, "symptom": None, "intent": "general"}

def query_agriculture_knowledge(db: Session, crop: str, symptom: str, intent: str = "general"):
    """Search the PostgreSQL database for hard facts."""
    results = {}
    
    # Check Soil Deficiency
    if (intent == "soil_deficiency" or not intent) and symptom:
        deficiency = db.query(models.SoilDeficiency).filter(
            models.SoilDeficiency.symptoms.ilike(f"%{symptom}%")
        ).first()
        if deficiency:
            results["soil_deficiency"] = {
                "name": deficiency.deficiency_name,
                "symptoms": deficiency.symptoms,
                "recommended_fertilizer": deficiency.recommended_fertilizer,
                "organic_solution": deficiency.organic_solution,
                "precautions": deficiency.precautions
            }
            # Get fertilizer if crop is known
            if crop:
                fert = db.execute(text("""
                    SELECT f.fertilizer_name, m.recommended_quantity, m.application_stage
                    FROM crops c
                    JOIN crop_fertilizer_mapping m ON c.id = m.crop_id
                    JOIN fertilizer_types f ON m.fertilizer_id = f.id
                    WHERE LOWER(c.crop_name) = :crop_name
                """), {"crop_name": crop.lower()}).fetchone()
                if fert:
                    results["fertilizer_recommendation"] = {
                        "fertilizer": fert[0],
                        "quantity": fert[1],
                        "stage": fert[2]
                    }

    # Check Pesticide
    if intent == "pesticide" and crop:
        pest = db.query(models.PesticideSolution).join(models.Crop).filter(
            models.Crop.crop_name.ilike(f"%{crop}%")
        ).first()
        if pest:
            results["pesticide_solution"] = {
                "problem": pest.pest_name if hasattr(pest, 'pest_name') else "Pest",
                "organic": pest.organic_pesticide,
                "chemical": pest.chemical_pesticide
            }

    return results

async def generate_expert_response(message, entities, db_data):
    """Synthesize DB facts with AI reasoning."""
    if not model_ai:
        return {"reply": "I'm sorry, I'm having trouble reasoning right now.", "solution": "N/A"}

    db_context = f"Database Findings: {json.dumps(db_data, default=str)}"
    prompt = f"""
    You are AgriAssist, a professional AI Agriculture Expert like ChatGPT/Gemini.
    A farmer asked: "{message}"
    
    Extracted Entities: {entities}
    {db_context}

    Your goal:
    1. If Database Findings exist, use them as your primary source of truth.
    2. If not, use your internal expertise to provide professional advice (Potential causes: Nitrogen deficiency, water stress, pests, then suggest actions).
    3. Sound friendly, helpful, and professional.

    Output REQUIREMENT:
    Return a valid JSON object in this EXACT format:
    {{
      "crop": "name of crop",
      "issue": "symptom described",
      "diagnosis": "possible disease or deficiency",
      "solution": "detailed fertilizer or medicine guidance",
      "organic_alternative": "natural compost or bio-pesticide",
      "precaution": "safety warning",
      "reply": "The full friendly paragraph response to the farmer"
    }}
    """
    try:
        response = model_ai.generate_content(prompt)
        # Clean the response text for JSON parsing
        raw_text = response.text.strip()
        print(f"RAW AI TEXT: {raw_text[:500]}...") # Log start of raw text
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            # Handle generic code blocks if they exist
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
        
        # Robustly find first '{' and last '}'
        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            raw_text = raw_text[start_idx:end_idx+1]
            
        return json.loads(raw_text)
    except Exception as e:
        return {
            "reply": f"Your {entities.get('crop', 'crop')} might be facing an issue. Please check soil moisture. (Error: {str(e)})",
            "diagnosis": "Unknown",
            "solution": "Consult local expert"
        }

@router.post("")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")
    role = (current_user.get("role") or request.role or "farmer").lower()
    message = request.message.strip()
    language = detect_language(message)

    if is_greeting(message):
        reply = "👨‍🌾 Welcome to AgriAssist! I am your AI agriculture expert. How can I help your farm today?"
        return {"role": role, "language": language, "reply": reply, "response": reply}

    # 1. AI Entity Extraction
    entities = await get_ai_entities(message)
    crop = entities.get("crop")
    symptom = entities.get("symptom")
    intent = entities.get("intent")

    # 2. Database Knowledge Retrieval
    db_data = query_agriculture_knowledge(db, crop, symptom, intent)

    # 3. AI Expert Reasoning (Grounded by DB)
    ai_response = await generate_expert_response(message, entities, db_data)
    
    # 4. Save and Return
    response_text = ai_response.get("reply", "Consult local expert")
    session_id = request.sessionId or "main"
    
    save_chat(db, user_id, message, response_text, intent=intent or "query", language=language.lower(), session_id=session_id)
    save_crop_analysis(db, user_id, ai_response, crop_name=crop)

    # Merge AI fields into response
    final_output = {
        "role": role,
        "language": language,
        "reply": response_text,
        "response": response_text,
        "sessionId": session_id,
        "structured_data": ai_response
    }
    
    return final_output

@router.post("/analyze-image")
async def analyze_image(item: ChatRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Analyze crop issue via simulated image detection."""
    user_id = current_user.get("user_id")
    message = item.message
    language = detect_language(message)
    
    # 1. AI Extraction
    entities = await get_ai_entities(message)
    
    # 2. DB Grounding
    db_data = query_agriculture_knowledge(db, entities.get("crop"), entities.get("symptom"), entities.get("intent"))
    
    # 3. AI Reasoning
    ai_response = await generate_expert_response(message, entities, db_data)
    
    reply = ai_response.get("reply", "Analysis complete.")
    save_chat(db, user_id, f"[IMAGE UPLOAD] {message}", reply, intent="image_analysis", language=language.lower())
    save_crop_analysis(db, user_id, ai_response, crop_name=entities.get("crop"))
    
    return {"reply": reply, "structured_data": ai_response}
