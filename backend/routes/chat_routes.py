from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import desc
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from database import get_db
import models

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
        
        return {"user_id": int(user_id), "role": role, "email": email}
    except JWTError:
        raise credentials_exception

router = APIRouter()

# GET ALL CHAT SESSIONS (Simplified to a single thread since session_id was removed from schema)
@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")

    # Get the latest message to show as title/updatedAt
    latest_chat = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user_id).order_by(desc(models.ChatHistory.created_at)).first()
    
    if not latest_chat:
        return {"sessions": []}
        
    title = latest_chat.message
    if len(title) > 30:
        title = title[:30] + "..."
        
    return {"sessions": [{
        "sessionId": "main",
        "title": title,
        "updatedAt": latest_chat.created_at.isoformat() if latest_chat.created_at else None
    }]}

# GET CHAT HISTORY
@router.get("/history/{session_id}")
async def get_history(session_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")

    chats = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user_id).order_by(models.ChatHistory.created_at).limit(100).all()
    
    formatted_chats = []
    for chat in chats:
        formatted_chats.append({
            "id": str(chat.id),
            "role": chat.role,
            "message": chat.message,
            "reply": chat.response,
            "timestamp": chat.created_at.isoformat() if chat.created_at else None
        })
        
    return {"history": formatted_chats}

@router.delete("/history/{session_id}")
async def clear_history(session_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")
    
    deleted_count = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user_id).delete()
    db.commit()
    
    return {"message": "Session cleared", "deleted_count": deleted_count}
