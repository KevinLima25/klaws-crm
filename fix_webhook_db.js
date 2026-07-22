const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');

// 1. Delete stale webhook_entity entry
db.prepare('DELETE FROM webhook_entity').run();
console.log('Deleted all webhook_entity entries');

// 2. Get workflow nodes and set webhookId
const wf = db.prepare("SELECT nodes FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const nodes = typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : JSON.parse(JSON.stringify(wf.nodes));

const whNode = nodes.find(n => n.type === 'n8n-nodes-base.webhook');
const newWhId = 'wh_' + Date.now();
whNode.webhookId = newWhId;
whNode.parameters.path = 'crm-chat';
console.log('Set webhookId:', newWhId);

// Update nodes in DB
db.prepare("UPDATE workflow_entity SET nodes=? WHERE id='WFCRM001chat01'").run(JSON.stringify(nodes));
console.log('Updated workflow nodes');

// 3. Insert correct webhook_entity entry (the format n8n expects: webhookId/path)
// When webhookId is set, the path in webhook_entity should be just the path (without prefix)

// Let's try the format: path = newWhId + '/' + 'crm-chat', webhookId = newWhId
// Actually, looking at n8n source: when webhookId is set, 
// webhookPath = webhookId + '/' + path
// webhookId = the generated UUID
// We should insert BOTH the webhookId and path separately
const ins = db.prepare("INSERT OR REPLACE INTO webhook_entity (workflowId, webhookPath, method, node, webhookId, pathLength) VALUES (?, ?, ?, ?, ?, ?)");
ins.run('WFCRM001chat01', newWhId + '/crm-chat', 'POST', 'CRM Webhook', newWhId, 1);
console.log('Inserted webhook_entity with new path');

// Verify
const wh = db.prepare('SELECT * FROM webhook_entity').all();
console.log('Webhook entities:', JSON.stringify(wh, null, 2));

const wf2 = db.prepare("SELECT id, name, active FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('WF:', JSON.stringify(wf2));

db.close();
console.log('Done. Restart n8n now.');
