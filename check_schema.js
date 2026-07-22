const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Check workflow_entity columns
console.log('workflow_entity columns:');
db.prepare("PRAGMA table_info(workflow_entity)").all().forEach(c => console.log(`  ${c.name} (${c.type})`));

console.log('\nworkflow_history columns:');
db.prepare("PRAGMA table_info(workflow_history)").all().forEach(c => console.log(`  ${c.name} (${c.type})`));

// Find the workflow with id containing CRM
const wfs = db.prepare("SELECT id, name, active FROM workflow_entity WHERE id LIKE '%CRM%'").all();
console.log('\nCRM workflows:', wfs);

db.close();
