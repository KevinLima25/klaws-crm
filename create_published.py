import sqlite3
from datetime import datetime
import uuid

conn = sqlite3.connect(r'C:\Users\User\Downloads\Waha N&N\n8n\data\database.sqlite')
c = conn.cursor()

# Get workflow info
c.execute("SELECT id, versionId, nodes FROM workflow_entity WHERE id='CRMchWEBHOOK123'")
row = c.fetchone()
wf_id = row[0]
version_id = row[1]
nodes = row[2]

# Extract webhook node ID
import json
parsed_nodes = json.loads(nodes)
webhook_node = [n for n in parsed_nodes if n['type'] == 'n8n-nodes-base.webhook'][0]
webhook_node_id = webhook_node['id']

now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

# Insert published version
c.execute("""
    INSERT INTO workflow_published_version (workflowId, publishedVersionId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
""", (wf_id, version_id, now, now))
print("Inserted workflow_published_version")

# Insert trigger status
c.execute("""
    INSERT INTO workflow_publication_trigger_status (workflowId, nodeId, versionId, status, errorMessage, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (wf_id, webhook_node_id, version_id, 'active', None, now, now))
print("Inserted workflow_publication_trigger_status")

# Update activeVersionId
c.execute("UPDATE workflow_entity SET activeVersionId=? WHERE id=?", (version_id, wf_id))
print("Updated activeVersionId")

conn.commit()
print("Done!")

conn.close()
