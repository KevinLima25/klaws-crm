const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

console.log('=== TABLES ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => console.log(t.name));

console.log('\n=== webhook_entity SCHEMA ===');
const webhookSchema = db.prepare("PRAGMA table_info(webhook_entity)").all();
webhookSchema.forEach(c => console.log(c.name, c.type));

console.log('\n=== workflow_entity SCHEMA ===');
const wfSchema = db.prepare("PRAGMA table_info(workflow_entity)").all();
wfSchema.forEach(c => console.log(c.name, c.type));