from database import engine, Base, SessionLocal
import models
from sqlalchemy import text, inspect
import os

def fix_and_seed():
    # 1. Drop all tables
    tables = [
        "reminders", "chat_history", "users", "crop_issue_reports", 
        "farming_tools", "pesticide_solutions", "soil_deficiency", 
        "crop_fertilizer_mapping", "fertilizer_types", "crops",
        "fertilizer_knowledge", "shop_inventory", "chat_histories" # Some potential variants
    ]
    with engine.connect() as conn:
        for table in tables:
            try:
                conn.execute(text(f'DROP TABLE IF EXISTS {table} CASCADE;'))
            except:
                pass
        conn.commit()
    print("All tables dropped.")

    # 2. Recreate tables
    Base.metadata.create_all(bind=engine)
    print("Tables created via SQLAlchemy.")

    # 3. Verify columns for 'crops'
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('crops')]
    print(f"Crops table columns: {columns}")
    if 'crop_name' not in columns:
        print("ERROR: crop_name still missing!")
        return

    # 4. Seed agriculture data
    if os.path.exists('seed_500_crops.sql'):
        with open('seed_500_crops.sql', 'r') as f:
            sql = f.read()
        
        with engine.connect() as conn:
            try:
                conn.execute(text(sql))
                conn.commit()
                print("Seed SQL executed successfully.")
            except Exception as e:
                print(f"Seed SQL failed: {e}")
                
    # 5. Seed Farmer User
    from auth import get_password_hash
    db = SessionLocal()
    try:
        hashed = get_password_hash('farmer123')
        user = models.User(name='Farmer User', email='farmer@gmail.com', password_hash=hashed, role='farmer')
        db.add(user)
        db.commit()
        print("Farmer user created.")
    except Exception as e:
        print(f"User seed failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_and_seed()
