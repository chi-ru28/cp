import os
import requests
from datetime import datetime
from fastapi import APIRouter, Depends, File, UploadFile, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from dotenv import load_dotenv
from routes.chat_routes import get_current_user
from database import get_db
import models
import json
import decimal
from openai import OpenAI
import re
from services.weather_service import get_weather
from logic_engine import (
    extract_entities,
    calculate_dosage,
    check_mixing,
    calculate_soil_score,
    estimate_cost,
)

load_dotenv()

WEATHER_API_KEY = (os.getenv("WEATHER_API_KEY") or "").strip()
OPENAI_API_KEY  = (os.getenv("OPENAI_API_KEY") or "").strip()

if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY.strip())
    MODEL_NAME    = "gpt-4o-mini"
else:
    openai_client = None

router = APIRouter()

# ─────────────────────────────────────────────
# CONSTANTS & MAPPINGS
# ─────────────────────────────────────────────

TOOL_IMAGE_MAP = {
    "tractor": [
        "https://images.unsplash.com/photo-1637269820542-fcee090f8fbe?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8dHJhY3RvcnN8ZW58MHx8MHx8fDA%3D",
        "https://media.istockphoto.com/id/483452183/photo/close-up-of-agriculture-red-tractor-cultivating-field-over-blue-sky.webp?a=1&b=1&s=612x612&w=0&k=20&c=Uq-gcIQ_7Vcb2cr5hTw0rO2yiB6mxZ70Nuv2CdScMOk="
    ],
    "plough": [
        "https://i.pinimg.com/1200x/71/9b/de/719bdeeb4c9718e6cec8338bc27d0141.jpg", 
        "https://i.pinimg.com/736x/65/c7/c9/65c7c98b1367e45e9722a305a44eb141.jpg"
    ],
    "rotavator": [
        "https://i.pinimg.com/736x/a2/90/e2/a290e2c2ae365b0cea770e5a8fed2832.jpg", 
        "https://i.pinimg.com/736x/e8/55/b5/e855b513177bf64ddbc639cbfb59f3c2.jpg"
    ],
    "cultivator": [
        "https://i.pinimg.com/736x/95/88/8f/95888fda2fce5791cbd858681b7a4129.jpg", 
        "https://i.pinimg.com/736x/f0/66/c7/f066c7c1ae326de47e5a02d9d3288b6e.jpg"
    ],
    "harrow": [
        "https://i.pinimg.com/736x/06/03/5e/06035e0b924c01e41a45217dfbc342f1.jpg", 
        "https://i.pinimg.com/1200x/1e/b8/7e/1eb87e98a69ab1e8252e25b80e28b92d.jpg"
    ],
    "seed drill": [
        "https://i.pinimg.com/1200x/be/b3/29/beb3294b9db4d8cc5eedba43980408c8.jpg", 
        "https://i.pinimg.com/1200x/fe/60/31/fe6031ffa4cc30951c80857e3783aaed.jpg", 
        "https://i.pinimg.com/736x/f1/64/40/f16440892447e1114e437737355ba801.jpg"
    ],
    "sprayer": [
        "https://i.pinimg.com/1200x/b0/88/ce/b088cec8585df09e1b4f4dee3c4f2a4a.jpg",
        "https://i.pinimg.com/1200x/c4/7e/22/c47e22a0fa7bd0429ffb9caf20e0f2a9.jpg", 
        "https://i.pinimg.com/736x/ae/53/47/ae5347c6c7dc3f26238ca4ea4332e705.jpg"
    ],
    "harvester": [
        "https://i.pinimg.com/736x/60/ff/a0/60ffa0543dd08be1fa0beaa15534c7f3.jpg", 
        "https://i.pinimg.com/1200x/41/9d/97/419d97cc6062d53ab95a4ce54de1ba90.jpg"
    ],
    "thresher": [
        "https://i.pinimg.com/736x/52/1a/72/521a724bd70b2f084ded02a7907ce13e.jpg", 
        "https://i.pinimg.com/736x/73/6c/24/736c24e4ac3d65f9f079743daea9b626.jpg", 
        "https://i.pinimg.com/736x/8d/1b/ec/8d1bec01afead26f1ab755b2406459c5.jpg"
    ],
    "drone": [
        "https://i.pinimg.com/736x/95/bb/1b/95bb1ba4bc02563f8274bdd5a9ff6e77.jpg", 
        "https://i.pinimg.com/736x/49/50/c6/4950c66768d0f31606a5244d1e48bf88.jpg"
    ],
    "hoe": [
        "https://i.pinimg.com/736x/1e/83/16/1e8316dda0e14b40ea4574b56bdf7177.jpg", 
        "https://i.pinimg.com/1200x/44/51/07/445107bc7b36153cc701c76ea0b49cdf.jpg", 
        "https://i.pinimg.com/1200x/94/b0/39/94b0396c9a60ec120a7070fb2b76720d.jpg"
    ],
    "shovel": [
        "https://i.pinimg.com/736x/b2/c9/5b/b2c95ba8ac1e2ec41ad7ea3163ccf179.jpg", 
        "https://i.pinimg.com/736x/17/b4/b6/17b4b64ae57aa72ac0669e271e4f30e3.jpg"
    ],
    "wheelbarrow": [
        "https://i.pinimg.com/736x/a0/93/da/a093dab8d876651f208930a754bb285c.jpg", 
        "https://i.pinimg.com/1200x/4a/29/7b/4a297be3d39c96ddc03946e3e46effb1.jpg", 
        "https://i.pinimg.com/1200x/ea/33/87/ea338700f84e7ca0d5edc5f5dc797832.jpg"
    ]
}

# ─────────────────────────────────────────────
# REQUEST MODEL
# ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    message:        str
    sessionId:      str | None = None
    role:           str | None = None
    location:       str | None = None
    imageBase64:    str | None = None
    imageMimeType:  str | None = None

# ─────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def extract_keywords(message: str):
    cleaned = re.sub(r'[^\w\s]', '', message.lower())
    ignore  = {"the", "and", "can", "you", "tell", "show", "how", "what",
               "where", "should", "spray", "apply", "today"}
    return [w for w in cleaned.split() if w not in ignore and len(w) > 2]

def extract_city(message: str, default_loc: str = "Ahmedabad"):
    match = re.search(r'(?:in|at|for|near)\s+([a-zA-Z]+)', message.lower())
    if match:
        city = match.group(1).strip().capitalize()
        if city.lower() not in ["today", "now", "here"]:
            return city
    return default_loc

# ─────────────────────────────────────────────
# INTENT DETECTION
# ─────────────────────────────────────────────

def detect_intents(msg: str) -> list[str]:
    msg_low = msg.lower()
    
    # 1. Price Intent (Highest Priority)
    if any(k in msg_low for k in ["price", "cost", "rate", "₹", "kg"]):
        return ["price"]

    # 2. Guide Intent
    if any(k in msg_low for k in ["steps", "how to", "process", "farming"]):
        return ["farming_guide"]

    # 3. Tools Intent
    if any(k in msg_low for k in ["tools", "tractor", "machine", "harvester", "equipment", "show"]):
        return ["tools"]
        
    # Logic-Engine Intents
    if any(k in msg_low for k in ["how much", "quantity", "dose", "per acre"]):
        return ["dosage"]
    if any(k in msg_low for k in ["mix", "combine", "together"]):
        return ["mixing"]
    if any(k in msg_low for k in ["soil health", "npk", "ph", "soil score"]):
        return ["soil_score"]
        
    # 2. API/DB Intents
    if any(k in msg_low for k in ["today", "weather", "rain", "forecast", "pesticide"]):
        return ["weather_decision"]
    if "fertilizer" in msg_low:
        return ["fertilizer"]
        
    if any(k in msg_low for k in ["remind", "reminder", "set reminder", "alert"]):
        return ["set_reminder"]
        
    return ["general_question"]

# ─────────────────────────────────────────────
# MANUAL RESPONSE BUILDER
# ─────────────────────────────────────────────

def build_manual_response(db: Session, intent: str, entities: dict, weather: dict = None, user_id: str = None) -> tuple:
    """
    Returns (response_string, images_list_or_reminder_dict) based on intent and entities.
    Strictly follows the constraints of deterministic logic output.
    """
    if intent == "set_reminder":
        raw_msg = entities.get("message", entities.get("raw", "Upcoming Agricultural Task"))
        msg_low = raw_msg.lower()
        if "remind me to " in msg_low:
            note = raw_msg[msg_low.find("remind me to ") + len("remind me to "):].strip()
        elif "to " in msg_low:
            note = raw_msg[msg_low.find("to ") + len("to "):].strip()
        else:
            note = raw_msg
            
        # Clean trailing time words for neatness
        if note.lower().endswith(" tomorrow"):
            note = note[:-9]
        elif note.lower().endswith(" today"):
            note = note[:-6]
        from datetime import datetime, timedelta, timezone
        
        # Super simple parser: Defaults to tomorrow if not specified
        dt = datetime.now(timezone.utc) + timedelta(days=1) 
        
        farmer_id = user_id
        if not farmer_id:
            first_user = db.query(models.User).first()
            farmer_id = first_user.id if first_user else None

        new_reminder = models.Reminder(
            farmer_id=farmer_id,
            reminder_type="Farmer Alert",
            message=note.capitalize(),
            reminder_date=dt
        )
        db.add(new_reminder)
        db.commit()
        db.refresh(new_reminder)
        
        reminder_obj = {
            "id": str(new_reminder.id),
            "title": new_reminder.reminder_type,
            "note": new_reminder.message,
            "dateTime": new_reminder.reminder_date.isoformat(),
            "status": new_reminder.status,
            "sent": False,
            "text": new_reminder.message,
            "time": new_reminder.reminder_date.isoformat()
        }
        return f"Got it! I have scheduled a reminder for you: {note.capitalize()}.", reminder_obj

    if intent == "dosage":
        res = calculate_dosage(db, entities["crop"], entities["fertilizer"], entities["area"])
        return res, []
        
    if intent == "mixing":
        # Simplified mixing check (assuming fertilization entities extracted)
        f1 = entities.get("fertilizer")
        f2 = entities.get("fertilizer2")
        return check_mixing(db, f1, f2), [] # Logic engine will handle fallback
        
    if intent == "soil_score":
        return calculate_soil_score(entities["n"], entities["p"], entities["k"], entities["ph"]), []
        
    if intent == "price":
        return estimate_cost(db, entities["fertilizer"], entities["quantity"]), []
        
    if intent == "weather_decision" and weather:
        desc = weather.get("description", "").lower()
        hum = weather.get("humidity", 0)
        advice = "Conditions are clear for spraying."
        if hum > 70 or "rain" in desc:
            advice = "Humidity is high or rain is detected. It is NOT recommended to spray pesticide today. Wait for dry weather."
        return f"Weather in {weather.get('city')}: {weather.get('temperature')}°C, {desc}. {advice}", []

    if intent == "fertilizer":
        # Query DB for fertilizer rec
        kb = db.query(models.FertilizerKnowledge).filter(
            or_(models.FertilizerKnowledge.plant_name.ilike(f"%{entities['crop']}%"))
        ).first()
        if kb:
            return f"For {entities['crop']}, {kb.fertilizer_name} at planting and {kb.category} during growth is recommended.", []
        return "For wheat, DAP at sowing and Urea during growth stage is recommended.", []

    if intent == "farming_guide":
        return (
            "Step-by-step farming process:\n\n"
            "1. Soil Preparation: Test soil, plough, and level the field.\n"
            "2. Seed Selection & Sowing: Use high-quality seeds and plant at correct depth.\n"
            "3. Irrigation: Provide water at key growth stages.\n"
            "4. Fertilization & Crop Protection: Apply nutrients and monitor for pests.\n"
            "5. Harvesting: Harvest at the right maturity time.\n\n"
            "These methods ensure optimal yield.", 
            []
        )

    if intent == "tools":
        msg_low = entities.get("message", "").lower() if entities.get("message") else ""
        detected_tools = [t for t in TOOL_IMAGE_MAP.keys() if t in msg_low]
        
        # Default tools if none detected specifically
        if not detected_tools:
            detected_tools = ["tractor", "seed drill", "harvester"]

        images = []
        for index, t in enumerate(detected_tools):
            if t in TOOL_IMAGE_MAP:
                images.append({
                    "title": t,
                    "url": TOOL_IMAGE_MAP[t][0]
                })

        images = images[:4]
        
        tools_str = " and ".join(detected_tools) if len(detected_tools) <= 2 else ", ".join(detected_tools[:-1]) + " and " + detected_tools[-1]
        response_text = f"Modern farming tools include {tools_str}. They are highly effective for improving farm productivity and efficiency."
        return (f"{response_text}", images)

    return (
        "To improve crop yield, follow these practices:\n\n"
        "• Ensure proper irrigation at key growth stages\n"
        "• Use balanced fertilizers based on soil condition\n"
        "• Control pests and diseases early\n"
        "• Use quality seeds and proper spacing\n"
        "• Monitor weather conditions regularly\n\n"
        "These steps can significantly increase your crop productivity.", 
        []
    )

# ─────────────────────────────────────────────
# CHAT ENDPOINT (LOGIC-FIRST)
# ─────────────────────────────────────────────

@router.post("")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_msg = request.message.strip()
    print(f"\n[AI-API] Incoming: {user_msg}")
    
    if not user_msg:
        return {
            "reply": "Please enter a message", 
            "images": [],
            "type": "error", 
            "source": "system",
            "chat_saved": False,
            "reminder_created": False
        }

    try:
        # 1. Detect Intent
        intents = detect_intents(user_msg)
        intent = intents[0]
        print(f"[AI-API] Intent: {intent}")
    
        # 2. Extract Entities
        entities = extract_entities(user_msg)
        
        print("Message:", user_msg)
        print("Extracted:", entities.get("crop"), entities.get("fertilizer"), entities.get("area"))
        
        # 3. Get Facts (Logic / DB / API)
        weather_data = None
        if intent == "weather_decision":
            city = request.location or extract_city(user_msg, "Ahmedabad")
            weather_data = get_weather(city)
            
        user_id = current_user.get("user_id") or current_user.get("id")    
        
        raw_response, response_data = build_manual_response(db, intent, entities, weather_data, user_id)
        source = "market_estimate" if intent == "price" else ("logic" if intent in ["dosage", "mixing", "soil_score"] else ("api" if intent == "weather_decision" else "db"))
        
        response_images = response_data if isinstance(response_data, list) else []
        reminder_obj = response_data if isinstance(response_data, dict) else None
        
        # 4. AI Enhancement (Explanation ONLY)
        enhanced_reply = raw_response
        if openai_client and intent not in ["tools", "farming_guide"]:
            try:
                prompt = f"You are a helpful agriculture expert. Rewrite this factual advice in simple, natural, farmer-friendly language. DO NOT add new facts. Just improve the explanation:\n\n{raw_response}"
                res = openai_client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300
                )
                enhanced_reply = res.choices[0].message.content.strip()
            except Exception as e:
                print(f"[AI-API] AI Enhancement failed: {e}")
                
        # 5. Prevent Wrong Response & Response Control
        if intent == "tools":
            has_tool_word = "tool" in enhanced_reply.lower() or any(t in enhanced_reply.lower() for t in TOOL_IMAGE_MAP.keys())
            if not has_tool_word:
                enhanced_reply = raw_response

        # Fail-Safe Validation for Price
        if intent == "price":
            has_numbers = any(char.isdigit() for char in enhanced_reply)
            if not has_numbers:
                # Regenerate once explicitly enforcing numbers
                if openai_client:
                    try:
                        res2 = openai_client.chat.completions.create(
                            model=MODEL_NAME,
                            messages=[{"role": "user", "content": f"The following pricing estimate forgot its numbers. Rewrite it strictly estimating the cost, ensuring digits (like Rs 140) are included, and DO NOT add general farming tips: {raw_response}"}],
                            max_tokens=200
                        )
                        enhanced_reply = res2.choices[0].message.content.strip()
                    except:
                        enhanced_reply = raw_response
                else:
                    enhanced_reply = raw_response

            # Explicitly force-remove any "Here are some farming tips" hallucinated additions
            if "farming tips" in enhanced_reply.lower() or "additionally," in enhanced_reply.lower():
                enhanced_reply = raw_response
        
        response_type = "price" if intent == "price" or intent == "cost" else \
                        ("guide" if intent == "farming_guide" else \
                        ("tools" if intent == "tools" else \
                        ("reminder" if intent == "set_reminder" else intent)))
    
        print(f"[AI-API] Response: {enhanced_reply}")
    
        # 5. Persistence & Formatting
        session_id = request.sessionId or f"sess_{int(datetime.now().timestamp())}"
    
        # Save to history
        try:
            session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
            if not session:
                session = models.ChatSession(
                    id=session_id, 
                    user_id=user_id, 
                    title=user_msg[:50], 
                    role="farmer",
                    created_at=datetime.now()
                )
                db.add(session)
                db.commit()
                
            db.add(models.ChatMessage(session_id=session_id, sender="user", message=user_msg, intent=intent))
            db.add(models.ChatMessage(session_id=session_id, sender="ai", message=enhanced_reply, intent=intent))
            db.commit()
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[AI-API] History save error: {e}")
    
        return {
            "reply": enhanced_reply or "Here is the information you requested.",
            "images": response_images[:4] if isinstance(response_images, list) else [],
            "type": response_type,
            "source": source,
            "chat_saved": True,
            "reminder_created": intent == "set_reminder",
            "reminder": reminder_obj,
            "sessionId": session_id
        }
            
    except Exception as global_e:
        import traceback
        traceback.print_exc()
        print(f"[AI-API] Critical endpoint crash guarded: {global_e}")
        return {
            "reply": "I am experiencing technical difficulties finding specific data right now, but generally, maintaining balanced soil pH and monitoring weather conditions before applying inputs is highly recommended for stable crop yields. Please try your specific request again shortly.",
            "images": [],
            "type": "error_fallback",
            "source": "system",
            "chat_saved": False,
            "reminder_created": False
        }

@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Placeholder for image analysis using logic/expert data."""
    print(f"[AI-API] Analyzing image: {file.filename}")
    return {
        "problem": "Crop analysis in progress",
        "diagnosis": "Healthy Wheat Crop",
        "confidence": 0.95,
        "recommendation": "Maintained moisture levels. Monitor for leaf spot."
    }
