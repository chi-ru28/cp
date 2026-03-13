from database import engine
from sqlalchemy import text

def seed_db():
    with engine.connect() as conn:
        with open('seed_500_crops.sql', 'r') as f:
            # Split and execute in chunks if needed, but let's try whole first
            sql = f.read()
            # Split by semicolon to execute separate statements
            statements = sql.split(';')
            for statement in statements:
                if statement.strip():
                    conn.execute(text(statement))
        conn.commit()
    print("Agriculture data seeded successfully")

if __name__ == "__main__":
    seed_db()
