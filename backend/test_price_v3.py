import requests
import os
from jose import jwt
import json
import time

# To run this, the backend must be active (e.g., uvicorn api.main:app --reload)
BASE_URL = "http://127.0.0.1:8000/api/chat"

# Setup authentication (mocking logic)
# We expect common JWT setup or use first user
try:
    from database import SessionLocal
    from models import User
    db = SessionLocal()
    usr = db.query(User).first()
    if not usr:
        print("Error: No user found in database for testing.")
        exit(1)
    SECRET_KEY = os.getenv("JWT_SECRET", "thisisasupersecretkeythatshouldbelongandunguessable123!")
    token = jwt.encode({"sub": usr.email, "id": str(usr.id), "role": usr.role}, SECRET_KEY, algorithm="HS256")
    db.close()
except Exception as e:
    print(f"Auth setup failed: {e}. Ensure database is accessible.")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

def test_query(msg, expected_intent=None, expected_text=None):
    print(f"\n[TESTING] Query: '{msg}'")
    try:
        response = requests.post(BASE_URL, json={"message": msg}, headers=headers)
        if response.status_code == 200:
            data = response.json()
            intent = data.get('type')
            reply = data.get('reply')
            print(f"RESULT | Intent: {intent}")
            print(f"REPLY: {reply}")
            
            error = False
            if expected_intent and intent != expected_intent:
                print(f"❌ FAIL: Expected intent {expected_intent}, got {intent}")
                error = True
            
            if expected_text and expected_text not in reply:
                print(f"❌ FAIL: Expected text '{expected_text}' not found in reply.")
                error = True
                
            if not error:
                print("✅ PASS")
        else:
            print(f"FAILED | Status: {response.status_code} | {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    print("=== FINAL AGRIASSIST INTENT & PRICE VERIFICATION ===")
    
    # 1. Price Priority + Quantity
    test_query("cost of urea for 10kg", "price", "₹140")
    
    # 2. Mixed Query (Price overrides Location)
    test_query("how much urea for 10kg near me", "price", "₹140")
    
    # 3. Simple Price
    test_query("urea price", "price", "₹14 per kg")
    
    # 4. Location Only
    test_query("where is shop", "location", "agricultural shop is available in your local market")
    
    # 5. Unknown Intent
    test_query("asdfghjkl", "unknown", "I didn’t understand your request")
    
    print("\nVerification Complete.")
