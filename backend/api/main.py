from fastapi import FastAPI, Depends, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
# FastAPI in Vercel maintains the same import structure if the project root is 'backend'
# However, adding explicit sys path might be safer if needed.
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
        reply = await ai_chatbot.generate_human_response(
            message=message,
            role="farmer",
            intent="general",
            entities={},
            db_data={},
            language="English"
        )
        return {"reply": reply}
    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return {"reply": "AI service is temporarily unavailable"}

@app.get("/ai-api/health")
def health_check():
    return {"status": "ok"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    with open("crash_traceback.log", "a") as f:
        f.write(f"\n--- Exception at {request.url} ---\n")
        f.write(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)},
    )

@app.get("/ai-api")
def read_root():
    return {"message": "Welcome to AgriAssist AI API"}
