from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# No specific DB connection scripts needed on startup,
# SQLAlchemy handles its connection pooling dynamically.
from routes import auth_routes, chat_routes
import ai_chatbot

app = FastAPI(title="AgriAssist Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["Chat History"])
app.include_router(ai_chatbot.router, prefix="/api/bot", tags=["AI Chatbot"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AgriAssist API"}
