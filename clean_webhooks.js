const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Show all webhooks
const wh = db.prepare('SELECT * FROM webhook_entity').all();
console.log('Current webhooks:');
wh.forEach(w => console.log(`  ${w.webhookPath} (${w.method}) - node: ${w.node}, webhookId: ${w.webhookId}`));

// Delete the bad test-http entry
db.prepare("DELETE FROM webhook_entity WHERE webhookPath LIKE '%test-http%'").run();
console.log('\nDeleted test-http webhook');

// Also update crm-chat to crm-chat-v2
db.prepare("DELETE FROM webhook_entity WHERE webhookPath = 'crm-chat'").run();
console.log('Deleted old crm-chat webhook');

// Verify
const wh2 = db.prepare('SELECT * FROM webhook_entity').all();
console.log('\nRemaining webhooks:');
wh2.forEach(w => console.log(`  ${w.webhookPath} (${w.method})`));

db.close();
