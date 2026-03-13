from database import engine
from sqlalchemy import text

def enable_extension():
    with engine.connect() as conn:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto";'))
        conn.commit()
        print("Extension pgcrypto enabled successfully")

if __name__ == "__main__":
    enable_extension()
