const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get current node config from active version
const wh = db.prepare("SELECT * FROM workflow_history WHERE versionId = (SELECT activeVersionId FROM workflow_entity WHERE id='WFCRM001chat01')").get();
if (!wh) { console.log('No active version found'); db.close(); return; }

let nodes = typeof wh.nodes === 'string' ? JSON.parse(wh.nodes) : wh.nodes;
const salvar = nodes.find(n => n.name === 'Salvar no Buffer');

console.log('Full Salvar node:');
console.log(JSON.stringify(salvar, null, 2));

db.close();
