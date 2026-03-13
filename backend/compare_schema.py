from database import engine
from sqlalchemy import inspect
import re

def compare_all():
    # 1. Inspect Database
    inspector = inspect(engine)
    db_schema = {}
    for table_name in inspector.get_table_names():
        db_schema[table_name] = [c['name'] for c in inspector.get_columns(table_name)]

    # 2. Inspect Seed File
    with open('seed_500_crops.sql', 'r') as f:
        content = f.read()
    
    tables = [
        "crops", "fertilizer_types", "crop_fertilizer_mapping", 
        "soil_deficiency", "pesticide_solutions", "farming_tools"
    ]
    
    print("Schema Comparison (DB vs SQL File):")
    for table in tables:
        db_cols = db_schema.get(table, "NOT IN DB")
        match = re.search(fr"INSERT INTO {table}\s*\((.*?)\)", content, re.IGNORECASE)
        sql_cols = [c.strip() for c in match.group(1).split(',')] if match else "NOT IN SQL"
        
        print(f"\n--- Table: {table} ---")
        print(f"DB:  {db_cols}")
        print(f"SQL: {sql_cols}")
        
        if db_cols != "NOT IN DB" and sql_cols != "NOT IN SQL":
            mismatches = set(sql_cols) - set(db_cols)
            if mismatches:
                print(f"!!! MISSING IN DB: {mismatches}")
            else:
                print("Match OK")

if __name__ == "__main__":
    compare_all()
