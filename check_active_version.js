const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const activeVersionId = db.prepare("SELECT activeVersionId FROM workflow_entity WHERE id='WFCRM001chat01'").get().activeVersionId;
console.log('Active version ID:', activeVersionId);
const hist = db.prepare("SELECT * FROM workflow_history WHERE workflowId='WFCRM001chat01' AND versionId=?").get(activeVersionId);
if (hist) {
  console.log('History entry keys:', Object.keys(hist));
  console.log('autosaved:', hist.autosaved);
  console.log('name:', hist.name);
  const nodes = typeof hist.nodes === 'string' ? JSON.parse(hist.nodes) : hist.nodes;
  const conns = typeof hist.connections === 'string' ? JSON.parse(hist.connections) : hist.connections;
  console.log('Nodes count:', Array.isArray(nodes) ? nodes.length : 'NOT ARRAY');
  console.log('Node names:', Array.isArray(nodes) ? nodes.map(n => n.name).join(', ') : 'N/A');
  console.log('Has connections:', Object.keys(conns).length > 0);
  // Check webhook node in history
  const whNode = Array.isArray(nodes) ? nodes.find(n => n.type === 'n8n-nodes-base.webhook') : null;
  if (whNode) {
    console.log('Webhook node in history:');
    console.log('  name:', whNode.name);
    console.log('  webhookId:', whNode.webhookId);
    console.log('  path:', whNode.parameters?.path);
  }
}
db.close();
