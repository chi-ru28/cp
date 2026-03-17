import psycopg2

NEON_URL = "postgresql://neondb_owner:npg_M1CliyGs9Sjq@ep-aged-smoke-a1x581od-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_db_summary():
    try:
        conn = psycopg2.connect(NEON_URL)
        cur = conn.cursor()
        
        # 1. Get all tables in the public schema
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = [t[0] for t in cur.fetchall()]
        
        print("="*60)
        print(f"{'Table Name':<30} | {'Columns':<10} | {'Rows':<10}")
        print("-"*60)
        
        total_rows = 0
        for table in tables:
            # Get column count
            cur.execute(f"SELECT count(*) FROM information_schema.columns WHERE table_name = '{table}';")
            col_count = cur.fetchone()[0]
            
            # Get row count
            cur.execute(f'SELECT count(*) FROM "{table}";')
            row_count = cur.fetchone()[0]
            total_rows += row_count
            
            print(f"{table:<30} | {col_count:<10} | {row_count:<10}")
            
        print("-"*60)
        print(f"{'TOTAL':<30} | {'-':<10} | {total_rows:<10}")
        print("="*60)
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error connecting to Neon: {e}")

if __name__ == "__main__":
    get_db_summary()
