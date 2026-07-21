import sqlite3
import json
import uuid
from datetime import datetime

conn = sqlite3.connect(r'C:\Users\User\Downloads\Waha N&N\n8n\data\database.sqlite')
c = conn.cursor()

# Clean up old workflow completely
c.execute("DELETE FROM workflow_publication_trigger_status WHERE workflowId='CRMchWEBHOOK123'")
c.execute("DELETE FROM workflow_published_version WHERE workflowId='CRMchWEBHOOK123'")
c.execute("DELETE FROM workflow_history WHERE workflowId='CRMchWEBHOOK123'")
c.execute("DELETE FROM shared_workflow WHERE workflowId='CRMchWEBHOOK123'")
c.execute("DELETE FROM webhook_entity WHERE workflowId='CRMchWEBHOOK123'")
c.execute("DELETE FROM workflow_entity WHERE id='CRMchWEBHOOK123'")
conn.commit()
print("Cleaned up old workflow")

# Create new IDs
wf_id = "WFCRM001chat01"
version_id = str(uuid.uuid4())
webhook_node_id = str(uuid.uuid4())
set_node_id = str(uuid.uuid4())
webhook_uuid = str(uuid.uuid4())
now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

nodes = [
    {
        "id": webhook_node_id,
        "name": "CRM Webhook",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 2,
        "position": [0, 300],
        "webhookId": webhook_uuid,
        "parameters": {
            "path": "crm-chat",
            "httpMethod": "POST",
            "responseMode": "lastNode",
            "responseData": "firstEntryJson",
            "options": {}
        }
    },
    {
        "id": set_node_id,
        "name": "Format Response",
        "type": "n8n-nodes-base.set",
        "typeVersion": 3.4,
        "position": [250, 300],
        "parameters": {
            "assignments": {
                "assignments": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "text",
                        "value": "={{ $json.message }}",
                        "type": "string"
                    }
                ]
            },
            "options": {}
        }
    }
]

connections = {
    "CRM Webhook": {
        "main": [[{"node": "Format Response", "type": "main", "index": 0}]]
    }
}

settings = {"executionOrder": "v1", "binaryMode": "separate", "availableInMCP": False}

nodes_json = json.dumps(nodes)
connections_json = json.dumps(connections)
settings_json = json.dumps(settings)

# Insert workflow_entity
c.execute("""
    INSERT INTO workflow_entity (id, name, active, nodes, connections, settings, pinData, versionId,
    triggerCount, meta, createdAt, updatedAt, isArchived, versionCounter, nodeGroups)
    VALUES (?, ?, 1, ?, ?, ?, '{}', ?, 1, '{"templateCredsSetupCompleted": true}', ?, ?, 0, 1, '[]')
""", (wf_id, 'CRM Chat', nodes_json, connections_json, settings_json, version_id, now, now))

# Insert shared_workflow
c.execute("""
    INSERT INTO shared_workflow (workflowId, projectId, role, createdAt, updatedAt)
    VALUES (?, ?, 'workflow:owner', ?, ?)
""", (wf_id, 'Pj0oqUZq7EOFtBZt', now, now))

# Insert webhook_entity
c.execute("""
    INSERT INTO webhook_entity (workflowId, webhookPath, method, node, webhookId, pathLength)
    VALUES (?, 'crm-chat', 'POST', ?, ?, 8)
""", (wf_id, webhook_node_id, webhook_uuid))

# Insert workflow_history
c.execute("""
    INSERT INTO workflow_history (versionId, workflowId, authors, createdAt, updatedAt, nodes, connections, name, autosaved, nodeGroups)
    VALUES (?, ?, 'kevin.limasl131@gmail.com', ?, ?, ?, ?, 'CRM Chat', 0, '[]')
""", (version_id, wf_id, now, now, nodes_json, connections_json))

# Insert workflow_published_version
c.execute("""
    INSERT INTO workflow_published_version (workflowId, publishedVersionId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
""", (wf_id, version_id, now, now))

# Insert workflow_publication_trigger_status
c.execute("""
    INSERT INTO workflow_publication_trigger_status (workflowId, nodeId, versionId, status, errorMessage, createdAt, updatedAt)
    VALUES (?, ?, ?, 'activated', NULL, ?, ?)
""", (wf_id, webhook_node_id, version_id, now, now))

# Update activeVersionId
c.execute("UPDATE workflow_entity SET activeVersionId=? WHERE id=?", (version_id, wf_id))

conn.commit()
print(f"Created new workflow: {wf_id}")
print(f"Webhook path: crm-chat")

conn.close()
