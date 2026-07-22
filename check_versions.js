const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');

// Check workflow_history table
const cols = db.prepare('PRAGMA table_info(workflow_history)').all();
console.log('workflow_history columns:', cols.map(c => c.name));

const hist = db.prepare("SELECT * FROM workflow_history WHERE workflowId='WFCRM001chat01' ORDER BY versionId DESC LIMIT 3").all();
for (const row of hist) {
  console.log('Version:', row.versionId, 'VersionName:', row.versionName || '', 'Created:', row.createdAt);
  if (row.nodes) {
    const nodes = typeof row.nodes === 'string' ? JSON.parse(row.nodes) : row.nodes;
    if (Array.isArray(nodes)) {
      console.log(' Nodes:', nodes.map(n => n.name).join(', '));
    }
  }
}

// Also check if activeVersionId matches the current nodes
const wf = db.prepare("SELECT id, active, activeVersionId, versionId FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('\nCurrent WF:', JSON.stringify(wf));
console.log('activeVersionId =', wf.activeVersionId);
console.log('versionId =', wf.versionId);

// Find node names from current nodes
const curNodes = db.prepare("SELECT nodes FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const curNodesParsed = typeof curNodes.nodes === 'string' ? JSON.parse(curNodes.nodes) : curNodes.nodes;
console.log('Current nodes in workflow_entity:', curNodesParsed.map(n => n.name).join(', '));

db.close();
