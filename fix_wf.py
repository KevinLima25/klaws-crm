import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()

cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
connections = json.loads(row[1])

# Find node IDs by name
node_map = {n['name']: n['id'] for n in nodes}
print("Node IDs:")
for name, nid in node_map.items():
    print(f"  {name}: {nid}")

# Remove old duplicate nodes (the ones with -> in name)
old_nodes = ["Master Router", "HTTP Request \u2192 OCR", "HTTP Request \u2192 Concilia\xe7\xe3o"]
new_nodes = [n for n in nodes if n['name'] not in old_nodes]

print(f"\nRemoving {len(nodes) - len(new_nodes)} old nodes")
nodes = new_nodes

# Update connections: point Salvar no Buffer to Master Router (Switch)
# Remove old connections from old nodes
old_node_ids = {node_map[name] for name in old_nodes if name in node_map}

# Fix connections
new_connections = {}
for src, targets in connections.items():
    if src in old_nodes:
        continue  # skip old source nodes
    new_connections[src] = targets

# Update Salvar no Buffer -> Master Router (Switch)
if "Salvar no Buffer" in new_connections:
    new_connections["Salvar no Buffer"]["main"] = [[{"node": "Master Router (Switch)", "type": "main", "index": 0}]]

print("\nUpdated connections:")
for src, targets in new_connections.items():
    print(f"  {src}: {targets}")

# Save
cursor.execute('''
    UPDATE workflow_entity 
    SET nodes = ?, connections = ?, updatedAt = ?
    WHERE name LIKE ?
''', (json.dumps(nodes), json.dumps(new_connections), "2026-07-21T18:00:00.000Z", '%CRM%'))

conn.commit()
print("\nSaved!")

# Verify
cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
conns = json.loads(row[1])
print(f"Final nodes: {len(nodes)}")
for n in nodes:
    print(f"  {n['name']} ({n['type']})")

print("\nConnections:")
for src, targets in conns.items():
    for k, v in targets.items():
        for conn in v:
            for c in conn:
                print(f"  {src} --{k}--> {c['node']} ({c['type']})")