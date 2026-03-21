import sys
from database import SessionLocal
import models
import uuid

db = SessionLocal()
try:
    user = db.query(models.User).first()
    session_id = f"sess_{uuid.uuid4().hex[:10]}"
    session = models.ChatSession(id=session_id, user_id=user.id, title="Test", role="farmer")
    db.add(session)
    db.commit()
    print("SUCCESS")
except Exception as e:
    print(f"ERROR_TYPE: {type(e).__name__}")
    if hasattr(e, 'orig'):
        print(f"ORIG: {e.orig}")
    print(f"MSG: {str(e)[:500]}")
finally:
    db.close()
