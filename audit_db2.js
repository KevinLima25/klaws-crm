const Database = require('better-sqlite3');
const db = new Database('n8n/data/database.sqlite');

const webhooks = db.prepare("SELECT id, workflowId, path, method FROM webhook_entity").all();
console.log('=== WEBHOOKS ===');
webhooks.forEach(w => console.log(w));

const wfs = db.prepare("SELECT id, name, nodes, connections, active, activeVersionId FROM workflow_entity").all();
console.log('\n=== WORKFLOW DETAILS ===');
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