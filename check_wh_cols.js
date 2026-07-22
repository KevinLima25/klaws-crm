const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');
const cols = db.prepare("PRAGMA table_info(workflow_history)").all();
console.log(JSON.stringify(cols, null, 2));
db.close();
