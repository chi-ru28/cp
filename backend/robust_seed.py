from database import engine
from sqlalchemy import text
import re

def seed_db():
    with engine.connect() as conn:
        with open('seed_500_crops.sql', 'r') as f:
            sql = f.read()
            
        # Better split: ignore semi-colons inside quotes
        # This is a simple heuristic, but usually works for simple inserts
        statements = re.split(r';\s*(?=\n|INSERT|CREATE|DROP|ALTER|UPDATE)', sql)
        
        count = 0
        for statement in statements:
            stmt = statement.strip()
            if stmt:
                try:
                    conn.execute(text(stmt))
                    count += 1
                except Exception as e:
                    print(f"Error executing statement: {e}")
        conn.commit()
    print(f"Successfully executed {count} statements")

if __name__ == "__main__":
    seed_db()
