import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"TRYING: {m.name}")
            try:
                model = genai.GenerativeModel(m.name)
                res = model.generate_content("Hi")
                print(f"  SUCCESS for {m.name}")
            except Exception as e:
                print(f"  FAILED for {m.name}: {e}")
except Exception as e:
    print(f"LIST FAILED: {e}")
