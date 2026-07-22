const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

const fks = db.prepare("PRAGMA foreign_key_list(workflow_entity)").all();
console.log('workflow_entity foreign keys:', JSON.stringify(fks, null, 2));

const fks2 = db.prepare("PRAGMA foreign_key_list(workflow_history)").all();
console.log('workflow_history foreign keys:', JSON.stringify(fks2, null, 2));

db.close();
