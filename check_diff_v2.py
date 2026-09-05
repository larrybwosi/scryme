import glob
import re

schema_text = ""
for path in glob.glob("packages/db/prisma/schema/*.prisma"):
    with open(path) as f:
        schema_text += f.read() + "\n"

migrations_text = ""
for path in sorted(glob.glob("packages/db/prisma/migrations/*/*.sql")):
    with open(path) as f:
        migrations_text += f.read() + "\n"

model_blocks = re.findall(r"model\s+(\w+)\s*\{([^}]+)\}", schema_text)
model_names = set(m[0] for m in model_blocks)

print("=== CHECKING TABLES ===")
missing_tables = []
for name, body in model_blocks:
    map_matches = re.findall(r'@@map\("([^"]+)"\)', body)
    table_name = map_matches[-1] if map_matches else name

    table_pattern = r'CREATE TABLE [^\(;]*["`\s]' + re.escape(table_name) + r'["`\s\(]'
    if not re.search(table_pattern, migrations_text, re.IGNORECASE):
        print(f"[MISSING TABLE] Model: {name} | Table: {table_name}")
        missing_tables.append((name, table_name, body))

print(f"\nTotal Missing Tables: {len(missing_tables)}")

# Now let's check for columns in existing tables
print("\n=== CHECKING COLUMNS IN EXISTING TABLES ===")
for name, body in model_blocks:
    map_matches = re.findall(r'@@map\("([^"]+)"\)', body)
    table_name = map_matches[-1] if map_matches else name

    table_pattern = r'CREATE TABLE [^\(;]*["`\s]' + re.escape(table_name) + r'["`\s\(]'
    if not re.search(table_pattern, migrations_text, re.IGNORECASE):
        continue # table is missing, checked above

    # Table exists, let's extract columns
    lines = body.split("\n")
    for line in lines:
        line = line.strip()
        if not line or line.startswith("//") or line.startswith("@@"):
            continue
        parts = line.split()
        if len(parts) >= 2:
            col_name = parts[0]
            col_map = re.search(r'@map\("([^"]+)"\)', line)
            db_col = col_map.group(1) if col_map else col_name

            col_type = parts[1].replace("?", "").replace("[]", "")
            if col_type in model_names:
                continue # relation field

            # Check if column is in migration SQL
            if db_col not in migrations_text:
                print(f"[MISSING COLUMN] Table: {table_name} | Column: {db_col} (Field: {col_name})")
