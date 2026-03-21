import asyncio
from models import User
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
    res = await ai_chatbot.chat(request=req, current_user=current_user_mock, db=db)
    print(f"\n--- USER: {msg} ---")
    print(f"INTENT: {res.get('intent')}")
    print(f"MULTI-INTENT: {res.get('multi_intent')}")
    print(f"FUNCTION: {res.get('function_called')}")
    print(f"REPLY: {res.get('reply')}")

async def main():
    msgs = [
        "how much urea for wheat 2 acres",
        "can I mix DAP and urea",
        "my soil N=60 P=45 K=50 pH=6.5",
        "what is the cost of DAP 10 kg"
    ]
    for m in msgs:
        await test_bot(m)

if __name__ == "__main__":
    asyncio.run(main())
