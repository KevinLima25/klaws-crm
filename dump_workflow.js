const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const WF_ID = 'WFCRM001chat01';

// Get current data
const wf = db.prepare("SELECT nodes, connections FROM workflow_entity WHERE id=?").get(WF_ID);
const nodes = typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : JSON.parse(JSON.stringify(wf.nodes));
const conns = typeof wf.connections === 'string' ? JSON.parse(wf.connections) : JSON.parse(JSON.stringify(wf.connections));

console.log('=== Current nodes ===');
nodes.forEach(n => console.log(`  ${n.name} (${n.type}) id=${n.id} pos=[${n.position}]`));

console.log('\n=== Current connections ===');
for (const [from, toData] of Object.entries(conns)) {
  for (const [outputIdx, outputs] of (toData.main || []).entries()) {
    for (const conn of (outputs || [])) {
      console.log(`  ${from}[${outputIdx}] -> ${conn.node}[${conn.index}]`);
    }
  }
  // Also show non-main connections
  for (const [type, outputs] of Object.entries(toData).filter(([k]) => k !== 'main')) {
    for (const [outputIdx, outs] of (outputs || []).entries()) {
      for (const conn of (outs || [])) {
        console.log(`  ${from}.${type}[${outputIdx}] -> ${conn.node}`);
      }
    }
  }
}

// Show a sample of the webhook's raw parameters
const whNode = nodes.find(n => n.type === 'n8n-nodes-base.webhook');
console.log('\n=== Webhook node raw params ===');
console.log(JSON.stringify(whNode, null, 2));

db.close();
