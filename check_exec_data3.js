const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');

const all = db.prepare('SELECT * FROM execution_data ORDER BY executionId DESC LIMIT 5').all();
for (const row of all) {
  console.log('--- Execution ID:', row.executionId, '---');
  if (row.workflowData) {
    const wfData = typeof row.workflowData === 'string' ? JSON.parse(row.workflowData) : row.workflowData;
    const nodes = wfData.nodes || [];
    console.log('Nodes:', nodes.map(n => n.name).join(', '));
  }
  if (row.workflowVersionId) {
    console.log('Version:', row.workflowVersionId);
  }
}
db.close();
