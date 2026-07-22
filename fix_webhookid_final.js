const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const WF_ID = 'WFCRM001chat01';
const WH_ID = 'wh_crm_' + Date.now();

// 1. Set webhookId on webhook node in workflow_entity
const wf = db.prepare("SELECT nodes, connections FROM workflow_entity WHERE id=?").get(WF_ID);
const nodes = typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : JSON.parse(JSON.stringify(wf.nodes));
const whNode = nodes.find(n => n.type === 'n8n-nodes-base.webhook');
whNode.webhookId = WH_ID;
db.prepare("UPDATE workflow_entity SET nodes=? WHERE id=?").run(JSON.stringify(nodes), WF_ID);

// 2. Set webhookId in ALL workflow_history versions
const versions = db.prepare("SELECT versionId, nodes FROM workflow_history WHERE workflowId=?").all(WF_ID);
for (const ver of versions) {
  const vNodes = typeof ver.nodes === 'string' ? JSON.parse(ver.nodes) : JSON.parse(JSON.stringify(ver.nodes));
  const vWh = vNodes.find(n => n.type === 'n8n-nodes-base.webhook');
  if (vWh) {
    vWh.webhookId = WH_ID;
    db.prepare("UPDATE workflow_history SET nodes=? WHERE workflowId=? AND versionId=?").run(JSON.stringify(vNodes), WF_ID, ver.versionId);
  }
}
console.log('Updated', versions.length, 'versions with webhookId:', WH_ID);

// 3. Replace webhook_entity: delete all, insert one with proper path
db.prepare("DELETE FROM webhook_entity").run();
db.prepare("INSERT INTO webhook_entity (workflowId, webhookPath, method, node, webhookId, pathLength) VALUES (?, ?, ?, ?, ?, ?)").run(WF_ID, WH_ID + '/crm-chat', 'POST', 'CRM Webhook', WH_ID, 1);

const wh = db.prepare('SELECT * FROM webhook_entity').all();
console.log('Webhooks:', JSON.stringify(wh));
db.close();
console.log('Done. Restart n8n now.');
