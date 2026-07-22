const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');

// The computed path by n8n is: WFCRM001chat01/crm%20webhook/crm-chat
// But there's a bug where n8n stores URL-encoded but compares decoded
// Let's try the decoded version
const decodedPath = 'WFCRM001chat01/crm webhook/crm-chat';

db.prepare("UPDATE webhook_entity SET webhookPath=? WHERE workflowId='WFCRM001chat01'").run(decodedPath);

const wh = db.prepare('SELECT * FROM webhook_entity').all();
console.log('Webhooks:', JSON.stringify(wh, null, 2));
db.close();
