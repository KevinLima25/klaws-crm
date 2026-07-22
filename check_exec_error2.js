const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get ALL recent executions for this workflow
const execs = db.prepare(`
  SELECT id, status, startedAt, stoppedAt, workflowId 
  FROM execution_entity 
  WHERE workflowId = 'WFCRM001chat01' 
  ORDER BY id DESC LIMIT 10
`).all();

console.log('Recent executions:');
execs.forEach(e => {
  console.log(`  Exec ${e.id}: ${e.status} | ${e.startedAt} -> ${e.stoppedAt}`);
  
  // Check if execution_data exists for this
  const d = db.prepare('SELECT data FROM execution_data WHERE executionId = ?').get(e.id);
  if (d && d.data) {
    const data = JSON.parse(d.data);
    const err = data?.resultData?.error;
    if (err) {
      console.log(`    Error: ${err.message}`);
      console.log(`    Desc: ${err.description}`);
    }
    const stack = data?.executionData?.nodeExecutionStack;
    if (stack) {
      stack.forEach(s => console.log(`    Node: ${s.node.name} -> ${s.executionStatus || 'unknown'}`));
    }
  }
});

db.close();
