const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const hist = db.prepare("SELECT versionId, name, nodes FROM workflow_history WHERE workflowId='WFCRM001chat01'").all();
let errors = 0;
for (const h of hist) {
  try {
    JSON.parse(h.nodes);
  } catch (e) {
    console.log('ERROR in version', h.versionId, h.name, ':', e.message);
    errors++;
  }
}
if (errors === 0) {
  console.log('All', hist.length, 'history entries have valid JSON!');
}
db.close();
