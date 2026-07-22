import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()

cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
connections = json.loads(row[1])

# Find node IDs by name
node_map = {}
for n in nodes:
    node_map[n['name']] = n['id']

# Remove old duplicate nodes
old_names = ["Master Router", "HTTP Request \u2192 OCR", "HTTP Request \u2192 Concilia\xe7\xe3o"]
old_ids = set()
for name in old_names:
    if name in node_map:
        old_ids.add(node_map[name])

new_nodes = [n for n in nodes if n['id'] not in old_ids]
print("Removed old nodes, remaining:", len(new_nodes))

# Fix connections
# 1. Remove connections from old nodes
new_connections = {}
for src, targets in connections.items():
    if src not in old_names:
        new_connections[src] = targets

# 2. Fix Salvar no Buffer -> Master Router (Switch)
if "Salvar no Buffer" in new_connections:
    new_connections["Salvar no Buffer"]["main"] = [[{"node": "Master Router (Switch)", "type": "main", "index": 0}]]

# Save
cursor.execute('''
    UPDATE workflow_entity 
    SET nodes = ?, connections = ?, updatedAt = ?
    WHERE name LIKE ?
''', (json.dumps(new_nodes), json.dumps(new_connections), "2026-07-21T18:00:00.000Z", '%CRM%'))

conn.commit()
print("Saved!")

# Verify
cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
conns = json.loads(row[1])
print("Final nodes:", len(nodes))
for n in nodes:
    print("  " + n['name'] + " (" + n['type'] + ")")

print("\nConnections:")
for src, targets in conns.items():
    for k, v in targets.items():
        for conn in v:
            for c in conn:
                print("  " + src + " --" + k + "--> " + c['node'] + " (" + c['type'] + ")")