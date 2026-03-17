import subprocess
import os

PG_DUMP_PATH = r"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
LOCAL_URL = "postgresql://postgres:1234@localhost:5432/AgriAssist"

def dump_schema():
    try:
        # Use subprocess to handle the path with spaces correctly
        cmd = [
            PG_DUMP_PATH,
            "--schema-only",
            "--no-owner",
            "--no-privileges",
            LOCAL_URL
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        with open("full_schema_dump.sql", "w", encoding="utf-8") as f:
            f.write(result.stdout)
            
        print("Schema dump successful: full_schema_dump.sql")
    except subprocess.CalledProcessError as e:
        print(f"Error dumping schema: {e.stderr}")
    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    dump_schema()
