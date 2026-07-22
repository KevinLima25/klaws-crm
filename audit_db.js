const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('=== TABLES ===');
tables.forEach(t => console.log(t.name));

// Get columns for workflow_entity
const cols = db.prepare("PRAGMA table_info(workflow_entity)").all();
console.log('\n=== workflow_entity columns ===');
cols.forEach(c => console.log(c.name, c.type));

db.close();