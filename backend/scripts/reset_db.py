import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.schema import DropTable
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SQLALCHEMY_DATABASE_URL, Base
import models

def reset_database():
    print(f"📡 Connecting to {SQLALCHEMY_DATABASE_URL}...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Drop all tables accurately
    print("🗑️ Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables according to updated models (UUID-based)
    print("🏗️ Creating new tables with UUID schema...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database reset successfully with unified UUID schema!")

if __name__ == "__main__":
    confirm = input("⚠️ This will DELETE ALL DATA in the PostgreSQL database. Are you sure? (y/n): ")
    if confirm.lower() == 'y':
        reset_database()
    else:
        print("❌ Reset cancelled.")
