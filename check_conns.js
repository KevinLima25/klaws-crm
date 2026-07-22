const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const wf = db.prepare("SELECT connections FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const conns = typeof wf.connections === 'string' ? JSON.parse(wf.connections) : wf.connections;
console.log('Connections:', JSON.stringify(conns, null, 2));
db.close();
