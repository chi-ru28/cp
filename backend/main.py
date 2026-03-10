from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection
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

@app.on_event("startup")
async def startup_db_client():
    connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    close_mongo_connection()

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["Chat History"])
app.include_router(ai_chatbot.router, prefix="/api/bot", tags=["AI Chatbot"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AgriAssist API"}
