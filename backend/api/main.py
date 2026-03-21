from fastapi import FastAPI, Depends, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import traceback

# Add the backend directory (parent of api/) to sys.path
# so that modules like ai_chatbot, models, routes etc. resolve correctly
# This is required for Vercel Python serverless (api/main.py is the entry point)
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from routes import auth_routes, chat_routes, database_routes, reminder_routes
import ai_chatbot
from database import Base, engine
import models  # ensures all models (incl. new ones) are registered
from pydantic import BaseModel

# Auto-create any missing tables (safe, non-destructive)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AgriAssist Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with actual Vercel URL
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
