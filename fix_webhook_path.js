const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const WF_ID = 'WFCRM001chat01';

// Fix the webhook_entity path to match what n8n expects
const CORRECT_PATH = 'WFCRM001chat01/CRM Webhook/crm-chat';

db.prepare("UPDATE webhook_entity SET webhookPath=? WHERE workflowId=?").run(CORRECT_PATH, WF_ID);

const wh = db.prepare('SELECT * FROM webhook_entity').all();
console.log('Webhooks:', JSON.stringify(wh, null, 2));
db.close();
console.log('Fixed webhook path. Restart n8n now.');
