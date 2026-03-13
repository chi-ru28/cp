from database import engine
from sqlalchemy import text

def seed():
    with engine.connect() as conn:
        with open('seed_500_crops.sql', 'r') as f:
            sql = f.read()
        
        # Execute the whole block as a single transaction
        try:
            conn.execute(text(sql))
            conn.commit()
            print("Seeding successful!")
        except Exception as e:
            print(f"Error seeding: {e}")

if __name__ == "__main__":
    seed()
