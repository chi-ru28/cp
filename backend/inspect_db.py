from database import engine
from sqlalchemy import inspect
import re

def inspect_all():
    # 1. Inspect Database
    inspector = inspect(engine)
    for table_name in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns(table_name)]
        print(f"Table {table_name}: {columns}")

    # 2. Inspect Seed File (just one example INSERT for mapping)
    print("\nChecking seed file for crop_fertilizer_mapping:")
    with open('seed_500_crops.sql', 'r') as f:
        for line in f:
            if "INSERT INTO crop_fertilizer_mapping" in line:
                print(line.strip()[:200]) # Print start of line
                break

if __name__ == "__main__":
    inspect_all()
