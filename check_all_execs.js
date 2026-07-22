const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Check ALL recent executions
const allExecs = db.prepare("SELECT id, workflowId, status, startedAt, stoppedAt FROM execution_entity ORDER BY id DESC LIMIT 20").all();
console.log('All recent executions:');
allExecs.forEach(e => {
  console.log(`  Exec ${e.id}: ${e.status} | workflow=${e.workflowId} | ${e.startedAt} -> ${e.stoppedAt}`);
});

// Check if there are any other workflow_entity entries
const allWfs = db.prepare("SELECT id, name, active FROM workflow_entity").all();
console.log('\nAll workflows:');
allWfs.forEach(w => {
  console.log(`  ${w.id}: ${w.name} (active: ${w.active}, activeVersionId: ${w.activeVersionId || 'N/A'})`);
});

// Check workflow_history for all versions of our workflow
const histories = db.prepare("SELECT versionId, workflowId, createdAt, updatedAt, autosaved FROM workflow_history WHERE workflowId='WFCRM001chat01' ORDER BY createdAt DESC").all();
console.log('\nWorkflow history:');
histories.forEach(h => console.log(`  ${h.versionId}: ${h.createdAt} (autosaved: ${h.autosaved})`));

db.close();
