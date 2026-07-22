const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get original workflow
const orig = db.prepare("SELECT * FROM workflow_history WHERE versionId='e5fb97a4-9123-4243-8f0e-0916f39d99eb'").get();
let nodes = JSON.parse(orig.nodes);
let conn = JSON.parse(orig.connections);

// Remove webhookId from the webhook node
const webhookNode = nodes.find(n => n.type === 'n8n-nodes-base.webhook');
if (webhookNode) {
  delete webhookNode.webhookId;
  console.log('Removed webhookId. Path:', webhookNode.parameters.path);
  console.log('Response mode:', webhookNode.parameters.responseMode);
  // Change responseMode to lastNode for simplicity
  webhookNode.parameters.responseMode = 'lastNode';
  delete webhookNode.parameters.responseData;
  delete webhookNode.parameters.respondContinue;
}

// Save
const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const vid = crypto.randomUUID();

db.exec('BEGIN TRANSACTION');
try {
  db.prepare("DELETE FROM webhook_entity").run();
  db.prepare("INSERT INTO workflow_history (versionId, workflowId, authors, nodes, connections, name, createdAt, updatedAt, autosaved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)").run(vid, 'WFCRM001chat01', 'api', JSON.stringify(nodes), JSON.stringify(conn), 'CRM Chat (Simplified Webhook)', now, now);
  db.prepare("UPDATE workflow_entity SET name=?, nodes=?, connections=?, versionId=?, activeVersionId=?, updatedAt=?, versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?").run('CRM Chat (Simplified Webhook)', JSON.stringify(nodes), JSON.stringify(conn), vid, vid, now, 'WFCRM001chat01');
  db.exec('COMMIT');
  console.log('Deployed simplified workflow. vid:', vid);
} catch(e) { db.exec('ROLLBACK'); console.error('Error:', e.message); }
db.close();
