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
SECRET_KEY = os.getenv("JWT_SECRET", "thisisasupersecretkeythatshouldbelongandunguessable123!")
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
async def get_sessions(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")

    # Use a subquery or group by to get unique sessions
    from sqlalchemy import func
    sessions = db.query(
        models.ChatHistory.session_id,
        func.min(models.ChatHistory.message).label("first_message"),
        func.max(models.ChatHistory.created_at).label("updated_at")
    ).filter(models.ChatHistory.user_id == user_id).group_by(models.ChatHistory.session_id).order_by(desc("updated_at")).all()
    
    formatted = []
    for s in sessions:
        title = s.first_message or "New Chat"
        if len(title) > 40:
            title = title[:40] + "..."
        formatted.append({
            "sessionId": s.session_id,
            "title": title,
            "updatedAt": s.updated_at.isoformat() if s.updated_at else None
        })
        
    return {"sessions": formatted}

# GET CHAT HISTORY
@router.get("/history/{session_id}")
async def get_history(session_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")

    chats = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id,
        models.ChatHistory.session_id == session_id
    ).order_by(models.ChatHistory.created_at).all()
    
    formatted_chats = []
    for chat in chats:
        formatted_chats.append({
            "id": str(chat.id),
            "message": chat.message,
            "reply": chat.response,
            "timestamp": chat.created_at.isoformat() if chat.created_at else None
        })
        
    return {"history": formatted_chats, "sessionId": session_id}

@router.delete("/history/{session_id}")
async def clear_history(session_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")
    
    deleted_count = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id,
        models.ChatHistory.session_id == session_id
    ).delete()
    db.commit()
    
    return {"message": "Session deleted", "deleted_count": deleted_count}
