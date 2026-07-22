const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
// Check shared_workflow
try {
  const sw = db.prepare('SELECT * FROM shared_workflow').all();
  console.log('shared_workflow:', JSON.stringify(sw, null, 2));
} catch(e) {
  console.log('No shared_workflow table:', e.message);
}
// Check workflow_entity active, isArchived, etc
const wf = db.prepare("SELECT id, name, active, isArchived FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('WF:', JSON.stringify(wf));
// Check if there's a published column
const cols = db.prepare('PRAGMA table_info(workflow_entity)').all();
console.log('workflow_entity columns:', cols.map(c => `${c.name}(${c.type})`).join(', '));
db.close();
