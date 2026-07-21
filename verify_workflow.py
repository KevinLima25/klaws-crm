import sqlite3
import json
conn = sqlite3.connect(r'C:\Users\User\Downloads\Waha N&N\n8n\data\database.sqlite')
c = conn.cursor()

c.execute("SELECT id, name, active, isArchived FROM workflow_entity")
print("Workflows:")
for row in c.fetchall():
    print(f"  ID={row[0]}, name='{row[1]}', active={row[2]}, archived={row[3]}")

c.execute("SELECT * FROM webhook_entity")
print("\nWebhooks:")
for row in c.fetchall():
    print(f"  {row}")

# Verify integrity
c.execute("PRAGMA integrity_check")
print(f"\nIntegrity: {c.fetchone()[0]}")

conn.close()
