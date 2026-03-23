import os
import sys
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base
import backend.models

def sync_db():
    print("Connecting to database...")
    try:
        # Load environment variables
        load_dotenv()
        
        # Create tables
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Successfully synced all PostgreSQL tables to the database!")
    except Exception as e:
        print(f"Error syncing database: {e}")

if __name__ == "__main__":
    sync_db()
