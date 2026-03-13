from database import engine
from sqlalchemy import text

def seed_db():
    with engine.connect() as conn:
        with open('seed_500_crops.sql', 'r', encoding='utf-8') as f:
            statement = ""
            count = 0
            for line in f:
                if line.startswith('--') or not line.strip():
                    continue
                statement += line
                if ';' in line:
                    try:
                        conn.execute(text(statement))
                        count += 1
                        statement = ""
                        if count % 100 == 0:
                            conn.commit()
                            print(f"Executed {count} statements...")
                    except Exception as e:
                        print(f"Error at statement {count}: {e}")
                        statement = ""
            
            if statement.strip():
                conn.execute(text(statement))
            
            conn.commit()
            print(f"Finished! Total statements executed: {count}")

if __name__ == "__main__":
    seed_db()
