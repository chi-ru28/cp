import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key found: {api_key[:5]}...")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-pro')

try:
    print("Sending 'Hello' to Gemini...")
    response = model.generate_content("Hello")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"FAILED: {e}")
