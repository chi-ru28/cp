import os

files = [r'c:\cp\backend\database_schema.sql', r'c:\cp\backend\config\database_design.sql']

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        new_content = content.replace('DEFAULT gen_random_uuid()', '')
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Cleaned {file_path}")
