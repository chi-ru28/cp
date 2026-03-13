import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro"
]

print("Starting model discovery...")
for model_name in candidates:
    print(f"Testing model: {model_name}... ", end="", flush=True)
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hi")
        print("SUCCESS")
        print(f"Result: {response.text[:20]}...")
        # Save the working name to a file for the agent to read
        with open("working_model.txt", "w") as f:
            f.write(model_name)
        break
    except Exception as e:
        print(f"FAILED: {e}")

# If none of the candidates worked, try listing all available ones and testing them
else:
    print("\nNo candidates worked. Listing all available models...")
    try:
        working_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Testing {m.name}... ", end="", flush=True)
                try:
                    model = genai.GenerativeModel(m.name)
                    model.generate_content("Hi")
                    print("SUCCESS")
                    working_models.append(m.name)
                    with open("working_model.txt", "w") as f:
                        f.write(m.name)
                    break 
                except:
                    print("FAILED")
    except Exception as e:
        print(f"Error listing models: {e}")
