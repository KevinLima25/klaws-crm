const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Check webhook_entity table
const cols = db.prepare("PRAGMA table_info(webhook_entity)").all();
console.log('webhook_entity columns:', cols.map(c => c.name));

const webhooks = db.prepare("SELECT * FROM webhook_entity").all();
console.log('All webhooks:', JSON.stringify(webhooks, null, 2));

// Check if workflow has webhookId set
const wf = db.prepare("SELECT id, name, active, activeVersionId FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('\nWorkflow:', JSON.stringify(wf));

// Get the active version nodes
const wh = db.prepare("SELECT * FROM workflow_history WHERE versionId=?").get(wf.activeVersionId);
if (wh) {
  let nodes = typeof wh.nodes === 'string' ? JSON.parse(wh.nodes) : wh.nodes;
  const webhookNode = nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  if (webhookNode) {
    console.log('\nWebhook node:');
    console.log('  path:', webhookNode.parameters.path);
    console.log('  webhookId:', webhookNode.webhookId);
    console.log('  method:', webhookNode.parameters.httpMethod);
  }
}

db.close();
