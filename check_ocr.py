import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE id = ?', ('WFCRM001ocr01',))
row = cursor.fetchone()
nodes = json.loads(row[0])
conns = json.loads(row[1])
for n in nodes:
    print('  ' + n['name'] + ' (' + n['type'] + ')')
print('Connections:')
for src, tgt in conns.items():
    print('  ' + src + ' -> ' + str(tgt))