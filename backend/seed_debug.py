from database import engine
from sqlalchemy import text
import traceback

def seed():
    with engine.connect() as conn:
        with open('seed_500_crops.sql', 'r') as f:
            sql = f.read()
        
        try:
            conn.execute(text(sql))
            conn.commit()
            print("Seeding successful!")
        except Exception as e:
            print(f"FULL ERROR REPR: {repr(e)}")
            traceback.print_exc()

if __name__ == "__main__":
    seed()
