const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');

// Check the workflowData stored with latest execution
const execData = db.prepare("SELECT executionId, workflowData FROM execution_data ORDER BY executionId DESC LIMIT 1").get();
if (execData && execData.workflowData) {
  const wfData = typeof execData.workflowData === 'string' ? JSON.parse(execData.workflowData) : execData.workflowData;
  const nodes = wfData.nodes || wfData;
  console.log('Execution', execData.executionId, 'workflow nodes:');
  if (Array.isArray(nodes)) {
    nodes.forEach(n => console.log(' -', n.name, ':', n.type));
  } else {
    console.log('nodes is not array:', typeof nodes);
    console.log('keys:', Object.keys(wfData));
  }
}
db.close();
