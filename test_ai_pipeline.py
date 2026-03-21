import requests
import json

BASE_URL = "http://localhost:8000/ai-api/chat"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VuaXF1ZV8xMjNAZXhhbXBsZS5jb20iLCJyb2xlIjoiZmFybWVyIiwiaWQiOiIxYzA0NDBjMS1jYWJiLTRiMzItYWZhNC1lODVhMDU2MzA3NmYiLCJleHAiOjE3NzQ1MzM2NTJ9.W4qoJN-bVd5yPpmq5ehuQrPIZLXNbdUdf6v_QSHriwo"

def test_chat(message, location=None):
    print(f"\nTesting: {message}")
    payload = {
        "message": message,
        "location": location,
        "role": "farmer"
    }
    # For local test, we might need to bypass get_current_user or use a real token
    # Since I can't easily get a token here, I'll check if the server is running and try a request
    try:
        # Note: This will likely fail with 401 if auth is strictly enforced
        # I will check the code to see if I can bypass for testing
        headers = {"Authorization": f"Bearer {TOKEN}"}
        resp = requests.post(BASE_URL, json=payload, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat("Can I spray pesticide today in Ahmedabad?", "Ahmedabad")
    test_chat("What is the best fertilizer for wheat?")
