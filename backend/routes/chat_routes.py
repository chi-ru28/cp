from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "agriassist_super_secret_key_2026")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        role: str = payload.get("role")
        email: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
        
        return {"user_id": user_id, "role": role, "email": email}
    except JWTError:
        raise credentials_exception

router = APIRouter()

# GET ALL CHAT SESSIONS
@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    from ai_chatbot import chat_collection
    user_id = current_user.get("user_id")

    # Aggregate to get a list of unique sessionIds and their first message as the title
    pipeline = [
        {"$match": {"userId": user_id}},
        {"$sort": {"timestamp": 1}},
        {"$group": {
            "_id": "$sessionId",
            "firstMessage": {"$first": "$message"},
            "updatedAt": {"$last": "$timestamp"}
        }},
        {"$sort": {"updatedAt": -1}}
    ]
    
    sessions = await chat_collection.aggregate(pipeline).to_list(length=100)
    
    formatted_sessions = []
    for s in sessions:
        # Provide a default title if firstMessage is somehow missing
        title = s.get("firstMessage", "New Chat")
        if len(title) > 30:
            title = title[:30] + "..."
            
        formatted_sessions.append({
            "sessionId": s["_id"],
            "title": title,
            "updatedAt": s.get("updatedAt").isoformat() if s.get("updatedAt") else None
        })
        
    return {"sessions": formatted_sessions}

# GET CHAT HISTORY BY SESSION
@router.get("/history/{session_id}")
async def get_history(session_id: str, current_user: dict = Depends(get_current_user)):
    from ai_chatbot import chat_collection
    user_id = current_user.get("user_id")

    cursor = chat_collection.find({"userId": user_id, "sessionId": session_id}).sort("timestamp", 1)
    chats = await cursor.to_list(length=100)
    
    formatted_chats = []
    for chat in chats:
        formatted_chats.append({
            "id": str(chat["_id"]),
            "role": chat.get("role", "farmer"),
            "message": chat.get("message", ""),
            "reply": chat.get("reply", ""),
            "timestamp": chat.get("timestamp").isoformat() if chat.get("timestamp") else None
        })
        
    return {"history": formatted_chats}

@router.delete("/history/{session_id}")
async def clear_history(session_id: str, current_user: dict = Depends(get_current_user)):
    from ai_chatbot import chat_collection
    user_id = current_user.get("user_id")
    
    result = await chat_collection.delete_many({"userId": user_id, "sessionId": session_id})
    return {"message": "Session cleared", "deleted_count": result.deleted_count}
