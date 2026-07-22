const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const cols = db.prepare('PRAGMA table_info(execution_data)').all();
console.log('execution_data columns:', cols.map(c => c.name));
const execData = db.prepare('SELECT * FROM execution_data ORDER BY executionId DESC LIMIT 1').get();
if (execData) {
  console.log('executionData keys:', Object.keys(execData));
  if (execData.data) {
    const parsed = typeof execData.data === 'string' ? JSON.parse(execData.data) : execData.data;
    console.log('Data:', JSON.stringify(parsed).substring(0, 3000));
  }
} else {
  console.log('No execution_data found');
}
db.close();
