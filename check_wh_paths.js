const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');
// Check current webhook paths
const wh = db.prepare("SELECT webhookPath, method, webhookId FROM webhook_entity").all();
console.log('Registered webhooks:', wh.map(w => `${w.webhookPath} (${w.method})`).join(', '));
db.close();
