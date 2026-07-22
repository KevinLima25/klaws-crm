import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', ('WFCRM001ocr01',))
row = cursor.fetchone()
nodes = json.loads(row[0])
for n in nodes:
    if 'respond' in n['name'].lower():
        n['parameters'] = {
            "options": {},
            "respondWith": "json",
            "responseBody": "={{ $json }}",
            "responseCode": 200
        }
        print('Fixed Respond node:', json.dumps(n['parameters'], indent=2, ensure_ascii=False))
cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE id = ?', (json.dumps(nodes), 'WFCRM001ocr01'))
conn.commit()

cursor.execute('UPDATE workflow_history SET nodes = ? WHERE workflowId = ? AND versionId = ?',
               (json.dumps(nodes), 'WFCRM001ocr01', '0c86652cd3e647de80025e1b57fd05ef'))
conn.commit()
conn.close()
print('Done')