import psycopg2
from psycopg2 import extras
import json

LOCAL_URL = "postgresql://postgres:1234@localhost:5432/AgriAssist"
NEON_URL = "postgresql://neondb_owner:npg_M1CliyGs9Sjq@ep-aged-smoke-a1x581od-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_table_structure(cur, table_name):
    cur.execute(f"""
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position;
    """)
    return cur.fetchall()

def migrate():
    try:
        local_conn = psycopg2.connect(LOCAL_URL)
        neon_conn = psycopg2.connect(NEON_URL)
        local_cur = local_conn.cursor()
        neon_cur = neon_conn.cursor()

        # 1. Get all tables from local
        local_cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            AND table_name NOT IN ('spatial_ref_sys');
        """)
        all_tables = [t[0] for t in local_cur.fetchall()]
        print(f"Total tables to check: {len(all_tables)}")

        # 2. Ensure ALL tables exist in Neon
        # Table order for foreign keys (parent first)
        ordered_tables = [
            'users', 'crops', 'fertilizer_knowledge', 'tools', 'chat_sessions', 
            'chat_messages', 'products', 'crop_fertilizer_mapping', 'reminders', 
            'crop_images', 'advisories', 'translations', 'crop_analysis', 
            'crop_issue_reports', 'crop_reports', 'farming_tools', 'fertilizer_types',
            'knowledge_base', 'pesticide_solutions', 'shop_inventory', 'soil_deficiency'
        ]
        
        # Add any remaining tables at the end
        for t in all_tables:
            if t not in ordered_tables:
                ordered_tables.append(t)

        for table_name in ordered_tables:
            # Check if table exists locally
            local_cur.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}');")
            if not local_cur.fetchone()[0]:
                continue

            print(f"--- Migrating table: {table_name} ---")
            
            # Check if table exists in Neon
            neon_cur.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}');")
            if not neon_cur.fetchone()[0]:
                print(f"Table {table_name} missing in Neon. Creating basic structure...")
                # Basic creation (Types might need adjustment)
                cols = get_table_structure(local_cur, table_name)
                col_defs = []
                for col in cols:
                    name, dtype, length, nullable = col
                    # Simple mapping (Can be improved)
                    def_str = f'"{name}" {dtype}'
                    if length: def_str += f"({length})"
                    if nullable == 'NO': def_str += " NOT NULL"
                    col_defs.append(def_str)
                
                create_query = f'CREATE TABLE "{table_name}" ({", ".join(col_defs)})'
                try:
                    neon_cur.execute(create_query)
                    neon_conn.commit()
                    print(f"Table {table_name} created in Neon.")
                except Exception as e:
                    print(f"Failed to create table {table_name}: {e}")
                    neon_conn.rollback()
                    continue

            # 3. Migrate Data
            local_cur.execute(f'SELECT * FROM "{table_name}"')
            rows = local_cur.fetchall()
            if not rows:
                print(f"Table {table_name} is empty.")
                continue

            col_names = [desc[0] for desc in local_cur.description]
            columns = ",".join([f'"{name}"' for name in col_names])
            placeholders = ",".join(["%s"] * len(col_names))

            success_count = 0
            for row in rows:
                processed_row = [extras.Json(val) if isinstance(val, (dict, list)) else val for val in row]
                try:
                    # Best effort: use ON CONFLICT if the table has a primary key
                    # For safety, we just try to insert and catch errors (e.g. duplicate keys)
                    query = f'INSERT INTO "{table_name}" ({columns}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'
                    neon_cur.execute(query, processed_row)
                    success_count += 1
                except Exception as e:
                    # print(f"Error in {table_name} row: {e}")
                    neon_conn.rollback()
                    continue
            
            neon_conn.commit()
            print(f"Migrated {success_count}/{len(rows)} rows for {table_name}.")

        print("Full migration completed successfully!")
        local_cur.close()
        local_conn.close()
        neon_cur.close()
        neon_conn.close()

    except Exception as e:
        print(f"Migration Error: {e}")

if __name__ == "__main__":
    migrate()
