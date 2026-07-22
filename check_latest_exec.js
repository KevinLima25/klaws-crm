const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');
const execs = db.prepare("SELECT id, workflowId, status, startedAt, stoppedAt FROM execution_entity WHERE workflowId='WFCRM001chat01' ORDER BY id DESC LIMIT 10").all();
console.log('Recent executions:');
execs.forEach(e => console.log(`  ${e.id}: ${e.status} | ${e.startedAt} -> ${e.stoppedAt}`));

const latest = execs[0];
if (latest) {
  const d = db.prepare("SELECT data FROM execution_data WHERE executionId = ?").get(latest.id);
  if (d && d.data) {
    const data = JSON.parse(d.data);
    const err = data?.resultData?.error;
    if (err) console.log('Error:', err.message, '|', err.description);
    const stack = data?.executionData?.nodeExecutionStack;
    if (stack) {
      stack.forEach(s => {
        console.log(`  Node: ${s.node.name} -> ${s.executionStatus || 'unknown'}`);
        if (s.error) console.log('    Error:', s.error.message);
      });
    }
  }
}
db.close();
