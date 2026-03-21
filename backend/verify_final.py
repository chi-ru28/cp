import requests
import os
from database import SessionLocal
from models import User
from jose import jwt
import json

# 1. Generate Token
db = SessionLocal()
usr = db.query(User).first()
if not usr:
    print("Error: No user found in database to authenticate as.")
    exit(1)

print(f"DEBUG | Authenticating as User ID: {usr.id}")

SECRET_KEY = os.getenv("JWT_SECRET", "thisisasupersecretkeythatshouldbelongandunguessable123!")
token = jwt.encode({"sub": usr.email, "id": str(usr.id), "role": usr.role}, SECRET_KEY, algorithm="HS256")
db.close()

BASE_URL = "http://127.0.0.1:8000/ai-api/chat"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

def check_message(message):
    print(f"\n[TESTING] Query: '{message}'")
    try:
        response = requests.post(BASE_URL, json={"message": message}, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS | Intent: {data.get('intent')}")
            reply = data.get('reply')
            # Handle both string and JSON-string replies
            try:
                reply_obj = json.loads(reply)
                print(f"REPLY (JSON): {json.dumps(reply_obj, indent=2)}")
            except:
                print(f"REPLY (TEXT): {reply}")
        else:
            print(f"FAILED | Status: {response.status_code} | Error: {response.text}")
    except Exception as e:
        print(f"CONNECTION ERROR: {e}")

if __name__ == "__main__":
    print("=== AGRIASSIST FINAL END-TO-END VERIFICATION ===")
    
    # Test 1: Dosage (Seeded via seed_logic_engine.py)
    check_message("how much urea for wheat 2 acres")
    
    # Test 2: Mixing (Seeded)
    check_message("can I mix DAP and urea")
    
    # Test 3: Soil Score (Pure Logic)
    check_message("my soil N=60 P=45 K=50 pH=6.5")
    
    # Test 4: Cost (Seeded Products)
    check_message("what is the cost of DAP 10 kg")
    
    # Test 5: Hybrid Weather (API + AI)
    check_message("should I spray pesticide today in Ahmedabad")
