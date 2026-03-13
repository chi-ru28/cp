from database import engine, Base
import models
from sqlalchemy import text

def reset_db():
    tables = [
        "reminders", "chat_history", "users", "crop_issue_reports", 
        "farming_tools", "pesticide_solutions", "soil_deficiency", 
        "crop_fertilizer_mapping", "fertilizer_types", "crops"
    ]
    with engine.connect() as conn:
        for table in tables:
            conn.execute(text(f'DROP TABLE IF EXISTS {table} CASCADE;'))
        conn.commit()
    
    Base.metadata.create_all(bind=engine)
    print("Database reset and tables created via SQLAlchemy (no DB-side defaults)")

if __name__ == "__main__":
    reset_db()
