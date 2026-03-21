from database import engine
from sqlalchemy import text

with engine.connect() as con:
    try:
        con.execute(text("ALTER TABLE chat_sessions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
        con.commit()
        print("Successfully added created_at to chat_sessions")
    except Exception as e:
        print("Error:", e)
