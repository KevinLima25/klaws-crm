const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

console.log('=== WEBHOOKS ===');
const webhooks = db.prepare("SELECT workflowId, webhookPath, method, node, webhookId FROM webhook_entity").all();
webhooks.forEach(w => console.log(w));

console.log('\n=== WORKFLOW DETAILS ===');
const wfs = db.prepare("SELECT id, name, nodes, connections, active, activeVersionId FROM workflow_entity").all();
wfs.forEach(wf => {
  const nodes = JSON.parse(wf.nodes);
  const conn = JSON.parse(wf.connections);
  console.log('\nID:', wf.id, '| Name:', wf.name, '| Active:', wf.active);
  console.log('Nodes (' + nodes.length + '):');
  nodes.forEach(n => console.log('  -', n.name, '| type:', n.type, '| typeVersion:', n.typeVersion));
  console.log('Connections:');
  Object.entries(conn).forEach(([k, v]) => {
    const targets = v.main?.[0]?.map(t => t.node).join(', ') || 'none';
    console.log('  ' + k + ' -> ' + targets);
  });
});

db.close();