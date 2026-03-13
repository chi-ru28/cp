import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

try:
    models = list(genai.list_models())
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            name = m.name
            try:
                model = genai.GenerativeModel(name)
                res = model.generate_content("Hi")
                print(f"SUCCESS_MODEL_NAME: {name}")
                exit(0)
            except:
                pass
except Exception as e:
    print(f"FAILED TO LIST: {e}")
