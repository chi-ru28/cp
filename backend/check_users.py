import sys
from sqlalchemy import text
from database import engine

try:
    with engine.begin() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users';"))
        columns = [r[0] for r in res]
        print("Columns in users table:", columns)
except Exception as e:
    print(f"Error: {e}")
