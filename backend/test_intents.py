import requests
import os
from jose import jwt
import json

# Setup authentication (using first user for testing)
# In a real test we might use a dedicated test user.
BASE_URL = "http://127.0.0.1:8000/api/chat"

# Token generation (mocking logic from verify_final.py)
from database import SessionLocal
from models import User
db = SessionLocal()
usr = db.query(User).first()
if not usr:
    print("Error: No user found in database.")
    exit(1)
SECRET_KEY = os.getenv("JWT_SECRET", "thisisasupersecretkeythatshouldbelongandunguessable123!")
token = jwt.encode({"sub": usr.email, "id": str(usr.id), "role": usr.role}, SECRET_KEY, algorithm="HS256")
db.close()

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

def test_query(msg, expected_intent=None):
    print(f"\n[TESTING] Query: '{msg}'")
    try:
        response = requests.post(BASE_URL, json={"message": msg}, headers=headers)
        if response.status_code == 200:
            data = response.json()
            intent = data.get('type')
            reply = data.get('reply')
            print(f"RESULT | Intent: {intent}")
            print(f"REPLY: {reply}")
            if expected_intent and intent != expected_intent:
                print(f"❌ FAIL: Expected intent {expected_intent}, got {intent}")
            else:
                print("✅ PASS")
        else:
            print(f"FAILED | Status: {response.status_code} | {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    print("=== AGRIASSIST REFINED INTENT VERIFICATION ===")
    
    # 1. Location
    test_query("where is the shop?", "location")
    test_query("nearest dealer address", "location")
    
    # 2. Price (Priority over Location)
    test_query("what is the price of urea near me?", "price")
    
    # 3. Unknown
    test_query("asdfghjkl", "unknown")
    
    # 4. Reminder (Highest Priority)
    test_query("remind me to water crops and what is the price of urea", "set_reminder")
    
    # 5. Guide
    test_query("how to grow wheat", "farming_guide")
    
    # 6. Tools
    test_query("show me some tractors", "tools")
