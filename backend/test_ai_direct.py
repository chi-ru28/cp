import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal
import ai_chatbot
print(f"IMPORTING AI_CHATBOT FROM: {ai_chatbot.__file__}")

async def test_direct():
    db = SessionLocal()
    try:
        message = "My wheat leaves are turning yellow"
        print(f"Testing message: {message}")
        
        # 1. AI Extraction
        entities = await ai_chatbot.get_ai_entities(message)
        print(f"Entities: {entities}")
        
        # 2. DB Grounding
        db_data = ai_chatbot.query_agriculture_knowledge(db, entities.get("crop"), entities.get("symptom"), entities.get("intent"))
        print(f"DB Data found: {bool(db_data)}")
        
        # 3. AI Reasoning
        try:
            ai_response = await ai_chatbot.generate_expert_response(message, entities, db_data)
            print("\nAI RESPONSE:")
            print(f"Reply: {ai_response.get('reply')}")
            print(f"Diagnosis: {ai_response.get('diagnosis')}")
            print(f"Solution: {ai_response.get('solution')}")
        except Exception as e:
            import traceback
            print(f"\nCRITICAL ERROR in calling generate_expert_response: {e}")
            traceback.print_exc()
        
        if "Error" in ai_response.get("reply", ""):
            print("\n!!! ERROR DETECTED IN REPLY !!!")
        else:
            print("\nSUCCESS: AI reasoning is working properly.")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_direct())
