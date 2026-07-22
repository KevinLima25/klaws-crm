const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');

// Get latest 3 execution_data
const all = db.prepare('SELECT * FROM execution_data ORDER BY executionId DESC LIMIT 3').all();
for (const row of all) {
  console.log('--- Execution ID:', row.executionId, '---');
  if (row.data) {
    const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    // Extract runData and lastNodeExecuted from the execution data structure
    // Structure is: [startData, taskData, resultData, contextData, ...]
    if (Array.isArray(parsed) && parsed.length > 2) {
      const resultData = parsed[2];
      if (resultData && resultData.lastNodeExecuted) {
        console.log('Last node executed:', resultData.lastNodeExecuted);
      }
      if (resultData && resultData.error) {
        console.log('Error:', resultData.error.message || JSON.stringify(resultData.error).substring(0, 200));
      }
    }
  }
}
db.close();
