const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const wf = db.prepare("SELECT nodes, connections FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const nodes = typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : wf.nodes;
const whNode = nodes.find(n => n.type === 'n8n-nodes-base.webhook');
console.log('Webhook node:');
console.log(JSON.stringify({
  name: whNode.name,
  type: whNode.type,
  typeVersion: whNode.typeVersion,
  parameters: whNode.parameters,
  webhookId: whNode.webhookId
}, null, 2));
const allNodes = nodes.map(n => ({ name: n.name, type: n.type }));
console.log('All nodes:', JSON.stringify(allNodes));
db.close();
