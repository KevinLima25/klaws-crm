const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get the workflow from DB
const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
if (wf) {
  console.log('DB workflow name:', wf.name);
  console.log('DB workflow active:', wf.active);
  console.log('DB workflow versionId:', wf.versionId);
  console.log('DB workflow activeVersionId:', wf.activeVersionId);
  
  let nodes = wf.nodes;
  if (typeof nodes === 'string') nodes = JSON.parse(nodes);
  console.log('DB nodes count:', nodes.length);
  console.log('DB node names:', nodes.map(n => n.name).join(', '));
  
  const salvar = nodes.find(n => n.name === 'Salvar no Buffer');
  if (salvar) {
    console.log('\nDB Salvar node params:');
    console.log('  specifyBody:', salvar.parameters.specifyBody);
    console.log('  jsonBody:', salvar.parameters.jsonBody ? salvar.parameters.jsonBody.substring(0, 100) : 'NOT SET');
    console.log('  bodyParameters:', salvar.parameters.bodyParameters ? 'SET' : 'NOT SET');
  }
}

db.close();
