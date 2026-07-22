const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get the active workflow version ID
const wf = db.prepare("SELECT id, activeVersion, activeVersionId, versionId FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('Workflow:', wf);

// Get the active version from workflow_history
const wh = db.prepare("SELECT * FROM workflow_history WHERE versionId=? OR workflowId=? ORDER BY createdAt DESC LIMIT 3")
  .all();
console.log('\nWorkflow history:', wh.map(h => ({ versionId: h.versionId, workflowId: h.workflowId, updatedAt: h.updatedAt, createdAt: h.createdAt })));

if (wh.length > 0) {
  const activeHistory = wh[0];
  if (activeHistory.nodes) {
    const nodes = typeof activeHistory.nodes === 'string' ? JSON.parse(activeHistory.nodes) : activeHistory.nodes;
    const salvar = nodes.find(n => n.name === 'Salvar no Buffer');
    if (salvar) {
      console.log('\nSalvar no Buffer node:');
      console.log('  type:', salvar.type);
      console.log('  typeVersion:', salvar.typeVersion);
      console.log('  parameters:', JSON.stringify(salvar.parameters, null, 2));
    }
  }
}

db.close();
