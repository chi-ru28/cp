from database import engine
from sqlalchemy import text
import re

def seed_granular():
    with open('seed_500_crops.sql', 'r') as f:
        sql = f.read()
    
    # Split by semicolon and newline
    statements = re.split(r';\s*\n', sql)
    
    with engine.connect() as conn:
        for i, stmt in enumerate(statements):
            stmt = stmt.strip()
            if not stmt: continue
            
            try:
                conn.execute(text(stmt))
                if i % 100 == 0:
                    conn.commit()
            except Exception as e:
                print(f"FAILED statement index {i}:")
                print(stmt[:200])
                print(f"ERROR: {e}")
                # Don't return, keep going to see if others work
        
        conn.commit()

if __name__ == "__main__":
    seed_granular()
