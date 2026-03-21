import sys
from sqlalchemy import text
from database import engine

try:
    with engine.begin() as conn:
        res = conn.execute(text("SELECT email, password_hash FROM users WHERE email = 'johndoe@gmail.com';"))
        rows = res.fetchall()
        print("John Doe row data:", rows)
except Exception as e:
    print(f"Error: {e}")
