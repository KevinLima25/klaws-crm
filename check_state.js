const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');
const wh = db.prepare('SELECT * FROM webhook_entity').all();
console.log('Webhooks:', JSON.stringify(wh, null, 2));
const wfs = db.prepare("SELECT id, name, active FROM workflow_entity").all();
console.log('All workflows:', JSON.stringify(wfs));
const wf = db.prepare("SELECT name, active, activeVersionId FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('CRM WF:', JSON.stringify(wf));
db.close();
