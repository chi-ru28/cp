import sys
from sqlalchemy import text
from database import engine

def apply_db_updates():
    try:
        with engine.begin() as conn:
            # Add column if not exists (using raw execution to catch errors if it already exists simply)
            try:
                conn.execute(text("ALTER TABLE tools ADD COLUMN image_url TEXT;"))
                print("Added image_url column to tools table.")
            except Exception as e:
                print(f"Column might already exist: {e}")
            
            # Update specific tool images
            conn.execute(text("""
                UPDATE tools 
                SET image_url = 'https://source.unsplash.com/featured/?tractor' 
                WHERE tool_name ILIKE '%tractor%';
            """))
            conn.execute(text("""
                UPDATE tools 
                SET image_url = 'https://source.unsplash.com/featured/?seed-drill' 
                WHERE tool_name ILIKE '%seed%';
            """))
            print("Successfully updated database images!")
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    apply_db_updates()
