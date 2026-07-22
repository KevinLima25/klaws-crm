import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT nodes FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
for n in nodes:
    if n['name'] == 'Master Router (Switch)':
        n['typeVersion'] = 3
        print('Updated typeVersion to 3')
        print(json.dumps(n['parameters'], indent=2))
cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE name LIKE ?', (json.dumps(nodes), '%CRM%'))
conn.commit()
print('Saved!')