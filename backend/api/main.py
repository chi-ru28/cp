from fastapi import FastAPI, Depends, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import traceback

# Add the backend directory (parent of api/) to sys.path
# so that modules like ai_chatbot, models, routes etc. resolve correctly
# This is required for Vercel Python serverless (api/main.py is the entry point)
from dotenv import load_dotenv
import os

# 1. Load Environment Variables First
load_dotenv()

# 2. Strict Environment Validation (Fail Fast)
required_env = ["OPENAI_API_KEY", "DATABASE_URL"]
for key in required_env:
    if not os.getenv(key):
        print(f"CRITICAL ERROR: {key} is missing in .env file")
        # In production/deployment, we might want to exit: 
        # import sys; sys.exit(1)

_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from routes import auth_routes, chat_routes, database_routes, reminder_routes, weather_routes, analysis_routes
import ai_chatbot
from database import Base, engine
import models  # ensures all models (incl. new ones) are registered
from pydantic import BaseModel

# Auto-create any missing tables (safe, non-destructive)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AgriAssist Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standardized Routes as per User Requirements
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["Chat History"])
app.include_router(ai_chatbot.router, prefix="/api/chat", tags=["AI Chatbot"])
app.include_router(database_routes.router, prefix="/api/database", tags=["Database Inspection"])
app.include_router(reminder_routes.router, prefix="/api/reminder", tags=["Reminders"])
app.include_router(weather_routes.router, prefix="/api/weather", tags=["Weather"])
app.include_router(analysis_routes.router, prefix="/api/analysis", tags=["Crop Analysis"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api")
@app.get("/api/")
def read_root():
    return {
        "message": "Welcome to AgriAssist API",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "chat": "/api/chat"
        }
    }

@app.get("/")
def home():
    return {"message": "AgriAssist AI Backend is active. Use /api/chat for AI access."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)
