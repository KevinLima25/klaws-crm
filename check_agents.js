const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const wf = db.prepare("SELECT id, name, active, nodes FROM workflow_entity WHERE id='UH5kg99biTCqPZ1F'").get();
const nodes = typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : wf.nodes;
console.log('Workflow:', wf.name, 'Active:', wf.active);
console.log('Nodes:');
nodes.forEach(n => console.log('  -', n.name, '(', n.type, ')'));

// Also check Agente_Comprovante and Agente_Conciliacao - search more broadly
const allNames = db.prepare("SELECT DISTINCT name FROM workflow_history ORDER BY name").all();
console.log('\nAll workflow history names:');
allNames.forEach(h => console.log('  -', h.name));

// Check if they exist in any table
const shared = db.prepare('SELECT * FROM shared_workflow').all();
console.log('\nShared workflows:', JSON.stringify(shared));

db.close();
