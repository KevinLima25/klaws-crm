const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Check recent executions
const execs = db.prepare("SELECT id, workflowId, status, startedAt FROM execution_entity ORDER BY id DESC LIMIT 10").all();
console.log('Recent executions:');
execs.forEach(e => console.log(`  ${e.id}: ${e.workflowId} - ${e.status} @ ${e.startedAt}`));

// Check execution_data for the latest failed execution
const latest = execs.filter(e => e.status === 'error')[0];
if (latest) {
  const d = db.prepare("SELECT data FROM execution_data WHERE executionId = ?").get(latest.id);
  if (d && d.data) {
    const data = JSON.parse(d.data);
    const err = data?.resultData?.error;
    if (err) {
      console.log(`\nExecution ${latest.id} error:`);
      console.log('  Message:', err.message);
      console.log('  Description:', err.description);
    }
    const stack = data?.executionData?.nodeExecutionStack;
    if (stack) {
      stack.forEach(s => {
        console.log(`  Node: ${s.node.name} -> ${s.executionStatus || 'unknown'}`);
        if (s.error) {
          console.log('    Error:', s.error.message);
          console.log('    Desc:', s.error.description);
        }
      });
    }
  }
}

db.close();
