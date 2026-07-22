import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()

cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE id = ?', ('WFCRM001ocr01',))
row = cursor.fetchone()
nodes = json.loads(row[0])
conns = json.loads(row[1])

# Remove duplicate Respond to Webhook node
respond_ids_to_keep = ['respond_ocr']
new_nodes = []
for n in nodes:
    if n['name'] == 'Respond to Webhook':
        if n['id'] in respond_ids_to_keep:
            new_nodes.append(n)
    else:
        new_nodes.append(n)

# Update connections to replace references
new_conns = {}
for src, tgt in conns.items():
    if src == 'Respond to Webhook':
        continue
    new_conns[src] = tgt
    for k, v in tgt.items():
        for conn in v:
            for c in conn:
                if c['node'] == 'Respond to Webhook':
                    c['node'] = 'Responder Webhook'

cursor.execute('UPDATE workflow_entity SET nodes = ?, connections = ? WHERE id = ?',
               (json.dumps(new_nodes), json.dumps(new_conns), 'WFCRM001ocr01'))
conn.commit()

# Also update workflow_history
cursor.execute('UPDATE workflow_history SET nodes = ?, connections = ? WHERE workflowId = ? AND versionId = ?',
               (json.dumps(new_nodes), json.dumps(new_conns), 'WFCRM001ocr01', '0c86652cd3e647de80025e1b57fd05ef'))
conn.commit()

print('Removed duplicate Respond to Webhook node')
print('Remaining respond nodes:')
for n in new_nodes:
    if 'respond' in n['name'].lower():
        print(' ', n['name'], n['id'])
conn.close()