import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(workflow_entity)')
for row in cursor.fetchall():
    print(row)