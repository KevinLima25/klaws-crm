const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get the active version nodes
const wh = db.prepare("SELECT * FROM workflow_history WHERE versionId='e5fb97a4-9123-4243-8f0e-0916f39d99eb'").get();
if (wh) {
  let nodes = wh.nodes;
  if (typeof nodes === 'string') nodes = JSON.parse(nodes);
  console.log('Active version node names:');
  nodes.forEach(n => console.log(`  ${n.name} (${n.type})`));
}

console.log('\n---');

// Get draft nodes
const draft = db.prepare("SELECT nodes FROM workflow_entity WHERE id='WFCRM001chat01'").get();
if (draft && draft.nodes) {
  let nodes = typeof draft.nodes === 'string' ? JSON.parse(draft.nodes) : draft.nodes;
  console.log('Draft node names:');
  nodes.forEach(n => console.log(`  ${n.name} (${n.type})`));
}

db.close();
