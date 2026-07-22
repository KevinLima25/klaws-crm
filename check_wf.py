import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT name, nodes, connections FROM workflow_entity WHERE name LIKE "%CRM%"')
for row in cursor.fetchall():
    wf_nodes = json.loads(row[1]) if row[1] else []
    wf_conns = json.loads(row[2]) if row[2] else {}
    print(f'=== Workflow: {row[0]} ===')
    for n in wf_nodes:
        print(f'  Node: {n.get("name")} | Type: {n.get("type")}')
    print()
    print('Connections:')
    print(json.dumps(wf_conns, indent=2))