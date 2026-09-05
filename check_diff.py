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
    map_match = re.search(r'@@map\("([^"]+)"\)', body)
    table_name = map_match.group(1) if map_match else name

    table_pattern = r'CREATE TABLE [^\(;]*["`\s]' + re.escape(table_name) + r'["`\s\(]'
    if not re.search(table_pattern, migrations_text, re.IGNORECASE):
        print(f"[MISSING TABLE] Model: {name} | Table: {table_name}")
        missing_tables.append((name, table_name, body))

print(f"\nTotal Missing Tables: {len(missing_tables)}")
