import os
from sqlalchemy import text
from database import engine

def add_status_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE reminders ADD COLUMN status VARCHAR(20) DEFAULT 'pending';"))
            conn.commit()
            print("Successfully added status column.")
        except Exception as e:
            print(f"Error adding column (might already exist): {e}")

if __name__ == "__main__":
    add_status_column()
