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

from routes import auth_routes, chat_routes, database_routes
import ai_chatbot
from pydantic import BaseModel

app = FastAPI(title="AgriAssist Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/ai-api/auth", tags=["Auth"])
app.include_router(chat_routes.router, prefix="/ai-api/chat", tags=["Chat History"])
app.include_router(ai_chatbot.router, prefix="/ai-api/chat", tags=["AI Chatbot"])
app.include_router(database_routes.router, prefix="/ai-api/database", tags=["Database Inspection"])

class SimpleChatRequest(BaseModel):
    message: str

@app.post("/ai-api/chat")
async def simple_chat(request: SimpleChatRequest):
    message = request.message
    print("User message:", message)
    
    if not ai_chatbot.openai_client:
        return {"reply": "AI service is temporarily unavailable"}
    
    try:
        resp = ai_chatbot.openai_client.chat.completions.create(
            model=ai_chatbot.MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are an expert agricultural assistant. Help farmers with crop issues, fertilizers, pesticides, weather impact, and farming tools."},
                {"role": "user", "content": message}
            ],
            max_tokens=800
        )
        reply = resp.choices[0].message.content.strip()
        return {"reply": reply}
    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return {"reply": "AI service is temporarily unavailable"}

@app.get("/ai-api/health")
def health_check():
    return {"status": "ok", "service": "AgriAssist AI API"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Log to stdout (visible in Vercel function logs) instead of a local file
    print(f"--- Exception at {request.url} ---")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)},
    )

@app.get("/ai-api")
@app.get("/ai-api/")
def read_root():
    return {
        "message": "Welcome to AgriAssist AI API",
        "status": "online",
        "endpoints": {
            "health": "/ai-api/health",
            "chat": "/ai-api/chat"
        }
    }

@app.get("/")
def home():
    return {"message": "AgriAssist AI Backend is active. Use /ai-api for API access."}
