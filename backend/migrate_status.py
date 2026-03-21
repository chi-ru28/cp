import sys
from sqlalchemy import text
from database import engine

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE reminders ADD COLUMN status VARCHAR(20) DEFAULT 'pending';"))
        print("Successfully added 'status' column to 'reminders' table.")
except Exception as e:
    print(f"Migration Error/Skip: {e}")
