import sys
import json
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
    with open('err_dump.json', 'w') as f:
        json.dump({"error": str(e.orig) if hasattr(e, 'orig') else str(e)}, f, indent=2)
finally:
    db.close()
