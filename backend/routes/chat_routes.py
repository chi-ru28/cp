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

    # Fetch dedicated sessions from ChatSession table
    sessions = db.query(models.ChatSession).filter(
        models.ChatSession.user_id == user_id
    ).order_by(desc(models.ChatSession.updated_at)).all()
    
    formatted = []
    for s in sessions:
        formatted.append({
            "sessionId": s.id,
            "title": s.title,
            "updatedAt": s.updated_at.isoformat() if s.updated_at else None,
            "role": s.role
        })
        
    return {"sessions": formatted}

# GET CHAT HISTORY FOR A SESSION
@router.get("/history/{session_id}")
async def get_history(session_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")

    # Verify session ownership
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or access denied")

    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).order_by(models.ChatMessage.timestamp).all()
    
    formatted_history = []
    for m in messages:
        formatted_history.append({
            "id": str(m.id),
            "sender": m.sender,
            "message": m.message,
            "intent": m.intent,
            "timestamp": m.timestamp.isoformat() if m.timestamp else None
        })
        
    return {
        "history": formatted_history, 
        "sessionId": session_id,
        "sessionTitle": session.title,
        "role": session.role
    }

# DELETE A SESSION (and all its messages via cascade)
@router.delete("/history/{session_id}")
async def delete_session(session_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")
    
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db.delete(session)
    db.commit()
    
    return {"message": "Session and history deleted"}
