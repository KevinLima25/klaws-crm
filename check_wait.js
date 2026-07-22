const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const curWf = db.prepare("SELECT nodes FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const nodes = typeof curWf.nodes === 'string' ? JSON.parse(curWf.nodes) : curWf.nodes;
const waitNode = nodes.find(n => n.type === 'n8n-nodes-base.wait');
console.log('Wait node:', JSON.stringify(waitNode, null, 2));
db.close();
