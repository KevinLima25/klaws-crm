import sqlite3
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%version%'")
for row in cursor.fetchall():
    print(row[0])