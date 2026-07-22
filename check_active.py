import sqlite3
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT name, id, active FROM workflow_entity WHERE name LIKE ?', ('%OCR%',))
row = cursor.fetchone()
print('OCR:', row)
cursor.execute('SELECT name, id, active FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
print('CRM:', row)