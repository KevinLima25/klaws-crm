import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
connections = json.loads(row[1])
print('NODES COUNT:', len(nodes))
for i, n in enumerate(nodes):
    print(f'  {i}: {n["name"]} ({n["type"]})')
print()
print('CONNECTIONS:')
for src, targets in connections.items():
    print(f'  {src}:')
    for t in targets.get('main', []):
        for tt in t:
            print(f'    -> {tt["node"]}')