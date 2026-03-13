import re

def extract_insert_columns():
    with open('seed_500_crops.sql', 'r') as f:
        content = f.read()
    
    # Extract columns from each table's INSERT statement
    tables = [
        "crops", "fertilizer_types", "crop_fertilizer_mapping", 
        "soil_deficiency", "pesticide_solutions", "farming_tools"
    ]
    
    for table in tables:
        match = re.search(fr"INSERT INTO {table}\s*\((.*?)\)", content, re.IGNORECASE)
        if match:
            columns = [c.strip() for c in match.group(1).split(',')]
            print(f"File {table}: {columns}")
        else:
            print(f"File {table}: Not found")

if __name__ == "__main__":
    extract_insert_columns()
