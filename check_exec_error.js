const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Check execution_entity for error details
try {
  const cols = db.prepare("PRAGMA table_info(execution_entity)").all();
  console.log('execution_entity columns:', cols.map(c => c.name));
} catch(e) { console.log('No execution_entity:', e.message); }

// Check execution_data for the latest failed execution
try {
  const cols = db.prepare("PRAGMA table_info(execution_data)").all();
  console.log('execution_data columns:', cols.map(c => c.name));
  
  // Get the latest failed workflow execution
  const execs = db.prepare(`
    SELECT e.id, e.status, e.startedAt, e.stoppedAt, e.workflowId, d.data 
    FROM execution_entity e 
    LEFT JOIN execution_data d ON d.executionId = e.id 
    WHERE e.workflowId = 'WFCRM001chat01' 
    ORDER BY e.id DESC LIMIT 3
  `).all();
  
  execs.forEach(ex => {
    console.log(`\nExec ${ex.id}: status=${ex.status} workflowId=${ex.workflowId}`);
    if (ex.data) {
      const data = JSON.parse(ex.data);
      if (data.resultData?.error) {
        console.log('  Error:', data.resultData.error.message);
        console.log('  Description:', data.resultData.error.description);
      }
      if (data.executionData?.nodeExecutionStack) {
        const stack = data.executionData.nodeExecutionStack;
        stack.forEach(s => {
          console.log(`  Node: ${s.node.name} - ${s.status || 'unknown'}`);
        });
      }
    } else {
      console.log('  No execution data');
    }
  });
} catch(e) { console.log('Error:', e.message); }

db.close();
