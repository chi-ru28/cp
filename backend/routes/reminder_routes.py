from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
from pydantic import BaseModel
import models
from database import get_db
from routes.chat_routes import get_current_user

router = APIRouter()

class ReminderCreate(BaseModel):
    title: str
    note: str = ""
    dateTime: str # ISO string

@router.get("")
@router.get("/")
def get_reminders(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    reminders = db.query(models.Reminder).filter(models.Reminder.farmer_id == user["user_id"]).order_by(models.Reminder.reminder_date.asc()).all()
    # Format for frontend ReminderBell.jsx
    formatted = []
    for r in reminders:
        formatted.append({
            "id": str(r.id),
            "title": r.reminder_type or "Reminder",
            "note": r.message,
            "dateTime": r.reminder_date.isoformat(),
            "status": r.status,
            "sent": r.status == "completed" or (r.reminder_date < datetime.now(timezone.utc))
        })
    return {"reminders": formatted}

@router.get("/due")
def get_due_reminders(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    # Get reminders that are passed their date but haven't been 'sent' (using a hacky check of < now for simplicity, as frontend tracks it)
    reminders = db.query(models.Reminder).filter(
        models.Reminder.farmer_id == user["user_id"],
        models.Reminder.reminder_date <= now
    ).all()
    
    formatted = []
    for r in reminders:
        # Ignore completed items on the due checker
        if r.status == "completed":
            continue
            
        formatted.append({
            "id": str(r.id),
            "title": r.reminder_type or "Reminder",
            "note": r.message,
            "dateTime": r.reminder_date.isoformat(),
            "status": r.status
        })
        
    return {"due": formatted}

@router.post("")
@router.post("/")
def create_reminder(req: ReminderCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    try:
        dt = datetime.fromisoformat(req.dateTime.replace('Z', '+00:00'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ISO datetime format")
        
    new_reminder = models.Reminder(
        farmer_id=user["user_id"],
        reminder_type=req.title,
        message=req.note,
        reminder_date=dt
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    return {
        "status": "success", 
        "id": str(new_reminder.id),
        "reminder": {
            "id": str(new_reminder.id),
            "title": new_reminder.reminder_type,
            "note": new_reminder.message,
            "dateTime": new_reminder.reminder_date.isoformat(),
            "status": new_reminder.status,
            "sent": False,
            "text": new_reminder.message,
            "time": new_reminder.reminder_date.isoformat()
        }
    }

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id, models.Reminder.farmer_id == user["user_id"]).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
    return {"status": "success"}

@router.put("/{reminder_id}")
def update_reminder_status(reminder_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id, models.Reminder.farmer_id == user["user_id"]).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    reminder.status = "completed"
    db.commit()
    db.refresh(reminder)
    
    return {
        "status": "success",
        "reminder": {
            "id": str(reminder.id),
            "title": reminder.reminder_type or "Reminder",
            "note": reminder.message,
            "dateTime": reminder.reminder_date.isoformat(),
            "status": reminder.status
        }
    }
