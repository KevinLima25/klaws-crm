const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');
db.prepare("DELETE FROM webhook_entity").run();
console.log('Cleared webhook_entity');
const wh = db.prepare("SELECT * FROM webhook_entity").all();
console.log('Remaining:', wh.length);
db.close();
