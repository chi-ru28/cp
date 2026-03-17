from database import engine, Base
import models # Ensure all models are registered with Base

def create_schema():
    print("Creating tables in Neon...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Schema created successfully in Neon!")
    except Exception as e:
        print(f"Error creating schema: {e}")

if __name__ == "__main__":
    create_schema()
