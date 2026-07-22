import sqlite3, json

conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()

# Load current workflow
cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
connections = json.loads(row[1])

# 1. Update webhook path to /webhook/crm-chat
for n in nodes:
    if n['type'] == 'n8n-nodes-base.webhook':
        n['name'] = 'CRM Webhook v2'
        n['parameters']['path'] = 'webhook/crm-chat'
        n['parameters']['options'] = {}
        print('Updated webhook:', n['parameters'])

# 2. Find "Salvar no Buffer" node index
salvar_idx = next(i for i, n in enumerate(nodes) if n['name'] == 'Salvar no Buffer')
dados_idx = next(i for i, n in enumerate(nodes) if n['name'] == 'DADOS')

# 3. Create Master Router (Switch) node
switch_node = {
    "parameters": {
        "rules": {
            "values": [
                {
                    "value1": "={{ $json.file_type }}",
                    "operation": "equal",
                    "value2": "image"
                },
                {
                    "value1": "={{ $json.file_type }}",
                    "operation": "equal",
                    "value2": "pdf"
                },
                {
                    "value1": "={{ $json.file_type }}",
                    "operation": "equal",
                    "value2": "spreadsheet"
                }
            ]
        },
        "options": {}
    },
    "id": "master-router-switch",
    "name": "Master Router",
    "type": "n8n-nodes-base.switch",
    "typeVersion": 3,
    "position": [750, 300],
    "executeOnce": False,
    "alwaysOutputData": False
}
nodes.insert(salvar_idx + 1, switch_node)
router_idx = salvar_idx + 1
dados_idx += 1  # shifted

# 4. Create HTTP Request nodes for routing
ocr_request = {
    "parameters": {
        "url": "http://n8n:5678/webhook/agent-ocr",
        "method": "POST",
        "options": {},
        "jsonParameters": True,
        "parameters": {}
    },
    "id": "http-ocr",
    "name": "HTTP Request → OCR",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [1000, 100],
    "executeOnce": False,
    "alwaysOutputData": False
}

conciliacao_request = {
    "parameters": {
        "url": "http://n8n:5678/webhook/agent-conciliacao",
        "method": "POST",
        "options": {},
        "jsonParameters": True,
        "parameters": {}
    },
    "id": "http-conciliacao",
    "name": "HTTP Request → Conciliação",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [1000, 300],
    "executeOnce": False,
    "alwaysOutputData": False
}

nodes.insert(dados_idx, ocr_request)
nodes.insert(dados_idx + 1, conciliacao_request)

# 5. Update connections
# Salvar no Buffer -> Master Router
connections['Salvar no Buffer'] = {
    "main": [[{"node": "Master Router", "type": "main", "index": 0}]]
}

# Master Router outputs: 0=image, 1=pdf, 2=spreadsheet, 3=fallback
connections['Master Router'] = {
    "main": [
        [{"node": "HTTP Request → OCR", "type": "main", "index": 0}],      # output 0: image
        [{"node": "HTTP Request → OCR", "type": "main", "index": 0}],      # output 1: pdf
        [{"node": "HTTP Request → Conciliação", "type": "main", "index": 0}], # output 2: spreadsheet
        [{"node": "DADOS", "type": "main", "index": 0}]                     # output 3: fallback (text)
    ]
}

# HTTP Request nodes -> Format Response (merge results)
connections['HTTP Request → OCR'] = {
    "main": [[{"node": "Format Response", "type": "main", "index": 0}]]
}
connections['HTTP Request → Conciliação'] = {
    "main": [[{"node": "Format Response", "type": "main", "index": 0}]]
}

# DADOS -> AI Agent (existing, unchanged)
# AI Agent -> Format Response (existing, unchanged)

# Save
cursor.execute('UPDATE workflow_entity SET nodes = ?, connections = ? WHERE name LIKE ?',
               (json.dumps(nodes), json.dumps(connections), '%CRM%'))
conn.commit()
print('Workflow updated successfully')

# Verify
cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])
connections = json.loads(row[1])
print(f'Nodes: {len(nodes)}')
for n in nodes:
    print(f'  {n["name"]} ({n["type"]})')
print('Connections:')
for src, tgt in connections.items():
    print(f'  {src}:')
    for out in tgt.get('main', []):
        for o in out:
            print(f'    -> {o["node"]}')

conn.close()