import sqlite3, json, uuid
from datetime import datetime

conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()

# Get current workflow
cursor.execute('SELECT id, name, nodes, connections, meta FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
wf_id = row[0]
wf_name = row[1]
nodes = json.loads(row[2])
connections = json.loads(row[3])
meta = json.loads(row[4]) if row[4] else {}

print(f'Workflow: {wf_name} (ID: {wf_id})')

# 1. Update webhook path
for n in nodes:
    if n['type'] == 'n8n-nodes-base.webhook':
        n['parameters']['path'] = 'webhook/crm-chat'
        n['name'] = 'CRM Webhook v2'
        print(f'Updated webhook: {n["parameters"]}')

# 2. Add Switch node after "Salvar no Buffer"
switch_node = {
    "id": str(uuid.uuid4()).replace('-', '')[:36],
    "name": "Master Router (Switch)",
    "type": "n8n-nodes-base.switch",
    "typeVersion": 2,
    "position": [750, 100],
    "parameters": {
        "rules": {
            "values": [
                {
                    "value": "{{ $('Salvar no Buffer').item.json.file_type }}",
                    "operation": "equals",
                    "key": "image"
                },
                {
                    "value": "{{ $('Salvar no Buffer').item.json.file_type }}",
                    "operation": "equals",
                    "key": "pdf"
                },
                {
                    "value": "{{ $('Salvar no Buffer').item.json.file_type }}",
                    "operation": "equals",
                    "key": "spreadsheet"
                }
            ]
        }
    }
}
nodes.append(switch_node)

# 3. Add HTTP Request nodes for OCR and Conciliação agents
ocr_node = {
    "id": str(uuid.uuid4()).replace('-', '')[:36],
    "name": "HTTP Request - Agente OCR",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [1000, -100],
    "parameters": {
        "method": "POST",
        "url": "http://n8n:5678/webhook/agent-ocr",
        "options": {},
        "jsonParameters": True,
        "parameters": {
            "json": {
                "user_id": "={{ $('Salvar no Buffer').item.json.user_id }}",
                "file_data": "={{ $('Salvar no Buffer').item.json.file_data }}",
                "file_type": "={{ $('Salvar no Buffer').item.json.file_type }}",
                "message_id": "={{ $('Salvar no Buffer').item.json.id }}"
            }
        }
    }
}
nodes.append(ocr_node)

conc_node = {
    "id": str(uuid.uuid4()).replace('-', '')[:36],
    "name": "HTTP Request - Agente Conciliação",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [1000, 300],
    "parameters": {
        "method": "POST",
        "url": "http://n8n:5678/webhook/agent-conciliacao",
        "options": {},
        "jsonParameters": True,
        "parameters": {
            "json": {
                "user_id": "={{ $('Salvar no Buffer').item.json.user_id }}",
                "file_data": "={{ $('Salvar no Buffer').item.json.file_data }}",
                "file_type": "={{ $('Salvar no Buffer').item.json.file_type }}",
                "message_id": "={{ $('Salvar no Buffer').item.json.id }}"
            }
        }
    }
}
nodes.append(conc_node)

# 4. Update connections
# Webhook -> Salvar no Buffer (keep)
# Salvar no Buffer -> Switch (NEW, replace DADOS)
# Switch (image/pdf) -> HTTP Request OCR
# Switch (spreadsheet) -> HTTP Request Conciliação
# Switch (fallback/text) -> DADOS -> AI Agent -> Format Response (existing path)
# OCR -> Format Response
# Conciliação -> Format Response

new_connections = {
    "CRM Webhook v2": {
        "main": [[{"node": "Salvar no Buffer", "type": "main", "index": 0}]]
    },
    "Salvar no Buffer": {
        "main": [[{"node": "Master Router (Switch)", "type": "main", "index": 0}]]
    },
    "Master Router (Switch)": {
        "main": [
            [{"node": "HTTP Request - Agente OCR", "type": "main", "index": 0}],      # Rule 0: image
            [{"node": "HTTP Request - Agente OCR", "type": "main", "index": 0}],      # Rule 1: pdf
            [{"node": "HTTP Request - Agente Conciliação", "type": "main", "index": 0}], # Rule 2: spreadsheet
            [{"node": "DADOS", "type": "main", "index": 0}]                           # Fallback: text
        ]
    },
    "DADOS": {
        "main": [[{"node": "AI Agent", "type": "main", "index": 0}]]
    },
    "AI Agent": {
        "main": [[{"node": "Format Response", "type": "main", "index": 0}]]
    },
    "HTTP Request - Agente OCR": {
        "main": [[{"node": "Format Response", "type": "main", "index": 0}]]
    },
    "HTTP Request - Agente Conciliação": {
        "main": [[{"node": "Format Response", "type": "main", "index": 0}]]
    },
    "Simple Memory": {
        "ai_memory": [[{"node": "AI Agent", "type": "ai_memory", "index": 0}]]
    },
    "Google Gemini Chat Model": {
        "ai_languageModel": [[{"node": "AI Agent", "type": "ai_languageModel", "index": 0}]]
    },
    "VERIFICAR AGENDA": {
        "ai_tool": [[{"node": "AI Agent", "type": "ai_tool", "index": 0}]]
    },
    "Criar Evento": {
        "ai_tool": [[{"node": "AI Agent", "type": "ai_tool", "index": 0}]]
    },
    "Delete an event in Google Calendar": {
        "ai_tool": [[{"node": "AI Agent", "type": "ai_tool", "index": 0}]]
    }
}

# Update workflow
new_nodes_json = json.dumps(nodes)
new_connections_json = json.dumps(new_connections)
meta['updatedAt'] = datetime.now().isoformat()

cursor.execute('''
    UPDATE workflow_entity 
    SET nodes = ?, connections = ?, meta = ?, updatedAt = ?
    WHERE id = ?
''', (new_nodes_json, new_connections_json, json.dumps(meta), datetime.now().isoformat(), wf_id))

conn.commit()
print(f'Updated workflow {wf_name}')
print(f'Nodes: {len(nodes)}')
print('Done!')

# Verify
cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE id = ?', (wf_id,))
row = cursor.fetchone()
nodes_check = json.loads(row[0])
conns_check = json.loads(row[1])
for n in nodes_check:
    print(f'  {n["name"]} ({n["type"]})')