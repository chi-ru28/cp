import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

def test_gemini_direct():
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": "Hello, are you available?"}]
        }]
    }
    
    print(f"Testing Gemini 1.5 Flash via direct HTTP...")
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        if "candidates" in data:
            print("SUCCESS: Received response from Gemini.")
            print(f"Reply: {data['candidates'][0]['content']['parts'][0]['text']}")
        else:
            print(f"FAILED: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"ERROR parsing response: {e}")
        print(f"Raw output: {response.text}")

if __name__ == "__main__":
    test_gemini_direct()
