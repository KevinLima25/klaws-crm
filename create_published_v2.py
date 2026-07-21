import sqlite3
import json
from datetime import datetime
import uuid

conn = sqlite3.connect(r'C:\Users\User\Downloads\Waha N&N\n8n\data\database.sqlite')
c = conn.cursor()

# Get workflow data
c.execute("SELECT id, versionId, name, nodes, connections, nodeGroups FROM workflow_entity WHERE id='CRMchWEBHOOK123'")
row = c.fetchone()
wf_id, version_id, name, nodes_json, connections_json, node_groups = row
now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

# Parse to get webhook node ID
parsed_nodes = json.loads(nodes_json)
webhook_node = [n for n in parsed_nodes if n['type'] == 'n8n-nodes-base.webhook'][0]
webhook_node_id = webhook_node['id']

# Clean up old failed inserts first
c.execute("DELETE FROM workflow_publication_trigger_status WHERE workflowId=?", (wf_id,))
c.execute("DELETE FROM workflow_published_version WHERE workflowId=?", (wf_id,))
c.execute("DELETE FROM workflow_history WHERE workflowId=?", (wf_id,))

# 1. Insert workflow_history
c.execute("""
    INSERT INTO workflow_history (versionId, workflowId, authors, createdAt, updatedAt, nodes, connections, name, autosaved, nodeGroups)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (version_id, wf_id, "kevin.limasl131@gmail.com", now, now, nodes_json, connections_json, name, False, node_groups))
print("Inserted workflow_history")

# 2. Insert workflow_published_version
c.execute("""
    INSERT INTO workflow_published_version (workflowId, publishedVersionId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
""", (wf_id, version_id, now, now))
print("Inserted workflow_published_version")

# 3. Insert workflow_publication_trigger_status
c.execute("""
    INSERT INTO workflow_publication_trigger_status (workflowId, nodeId, versionId, status, errorMessage, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (wf_id, webhook_node_id, version_id, 'activated', None, now, now))
print("Inserted workflow_publication_trigger_status")

conn.commit()
print("All records inserted successfully!")

conn.close()
