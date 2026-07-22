import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT nodes FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
for n in nodes:
    if n['type'] == 'n8n-nodes-base.webhook':
        print('Current webhook path:', n['parameters'].get('path'))
        # Fix: path should be just "crm-chat" not "webhook/crm-chat"
        n['parameters']['path'] = 'crm-chat'
        print('Fixed webhook path:', n['parameters'].get('path'))
cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE name LIKE ?', (json.dumps(nodes), '%CRM%'))
conn.commit()
print('Saved!')