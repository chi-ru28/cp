import asyncio
import json
import decimal
from models import User, ChatMessage
from database import SessionLocal
import ai_chatbot

# Mock dependencies
db = SessionLocal()
usr = db.query(User).first()
if not usr:
    print("No users in DB. Can't test.")
    exit(1)

current_user_mock = {"user_id": usr.id, "role": usr.role, "email": usr.email}

async def test_bot(msg):
    req = ai_chatbot.ChatRequest(message=msg)
    
    # Run the exact code block that fails directly to catch the pure exception
    user_id     = current_user_mock.get("user_id")
    role        = current_user_mock.get("role").lower()
    session_id  = "test_sess_1"
    user_msg    = req.message.strip()
    
    intents = ai_chatbot.detect_intents(user_msg)
    primary = intents[0]
    entities = ai_chatbot.extract_entities(user_msg)
    crop = entities["crop"]
    fertilizer = entities["fertilizer"]
    area = entities["area"]
    
    print(f"Entities extracted: {entities}")
    logic_reply = ai_chatbot.calculate_dosage(db, crop, fertilizer, area)
    print(f"Logic reply: {logic_reply}")
    
    # Try inserting directly to DB where it was failing
    audit_safe = json.loads(json.dumps({"logic_function": "calculate_dosage", "entities": entities}, cls=ai_chatbot.DecimalEncoder))
    
    print("Attempting to save ChatMessages...")
    db.add(ChatMessage(
        session_id=session_id, sender="user",
        message=user_msg, intent=primary
    ))
    db.add(ChatMessage(
        session_id=session_id, sender="ai",
        message=logic_reply,
        context_used=audit_safe,
        intent=primary
    ))
    db.commit()
    print("SUCCESS: ChatMessages saved")

if __name__ == "__main__":
    asyncio.run(test_bot("how much urea for wheat 2 acres"))
