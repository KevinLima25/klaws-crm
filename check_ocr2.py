import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT name, id, active, versionId, activeVersionId FROM workflow_entity WHERE name LIKE ?', ('%OCR%',))
row = cursor.fetchone()
print('Name:', row[0], 'ID:', row[1], 'Active:', row[2], 'VersionId:', row[3], 'ActiveVersionId:', row[4])