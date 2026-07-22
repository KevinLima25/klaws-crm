const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const WF_ID = 'WFCRM001chat01';

// 1. Get current nodes from workflow_entity
const wf = db.prepare("SELECT nodes, connections FROM workflow_entity WHERE id=?").get(WF_ID);
const nodes = typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : JSON.parse(JSON.stringify(wf.nodes));
const conns = typeof wf.connections === 'string' ? JSON.parse(wf.connections) : JSON.parse(JSON.stringify(wf.connections));

// 2. Set webhookId on the webhook node
const whNode = nodes.find(n => n.type === 'n8n-nodes-base.webhook');
const newWhId = 'wh2_' + Date.now();
whNode.webhookId = newWhId;
console.log('Set webhookId:', newWhId);

// 3. Update workflow_entity
db.prepare("UPDATE workflow_entity SET nodes=?, connections=? WHERE id=?").run(JSON.stringify(nodes), JSON.stringify(conns), WF_ID);

// 4. Update workflow_history for ALL versions (not just active)
const versions = db.prepare("SELECT versionId, nodes, connections FROM workflow_history WHERE workflowId=?").all(WF_ID);
for (const ver of versions) {
  const vNodes = typeof ver.nodes === 'string' ? JSON.parse(ver.nodes) : JSON.parse(JSON.stringify(ver.nodes));
  const vConns = typeof ver.connections === 'string' ? JSON.parse(ver.connections) : JSON.parse(JSON.stringify(ver.connections));
  const vWhNode = vNodes.find(n => n.type === 'n8n-nodes-base.webhook');
  if (vWhNode) {
    vWhNode.webhookId = newWhId;
    db.prepare("UPDATE workflow_history SET nodes=?, connections=? WHERE workflowId=? AND versionId=?").run(JSON.stringify(vNodes), JSON.stringify(vConns), WF_ID, ver.versionId);
  }
}
console.log('Updated', versions.length, 'history versions');

// 5. Replace webhook_entity
db.prepare("DELETE FROM webhook_entity WHERE workflowId=?").run(WF_ID);
db.prepare("INSERT INTO webhook_entity (workflowId, webhookPath, method, node, webhookId, pathLength) VALUES (?, ?, ?, ?, ?, ?)").run(WF_ID, newWhId + '/crm-chat', 'POST', 'CRM Webhook', newWhId, 1);
console.log('Replaced webhook_entity');

// Verify
const wh = db.prepare('SELECT * FROM webhook_entity').all();
console.log('Webhooks:', JSON.stringify(wh, null, 2));
const wf2 = db.prepare("SELECT id, active, activeVersionId FROM workflow_entity WHERE id=?").get(WF_ID);
console.log('WF:', JSON.stringify(wf2));

db.close();
