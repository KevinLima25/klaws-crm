const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');
const wf = db.prepare("SELECT name, versionId, activeVersionId, nodes, connections FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('Name:', wf.name);
console.log('versionId:', wf.versionId);
let nodes = JSON.parse(wf.nodes);
let conn = JSON.parse(wf.connections);
console.log('Nodes:', nodes.map(n=>n.name).join(', '));
console.log('Connections:', Object.keys(conn).join(', '));
const s = nodes.find(n=>n.name==='Salvar no Buffer');
if (s) {
  console.log('Salvar specifyBody:', s.parameters.specifyBody);
  console.log('Salvar jsonBody:', (s.parameters.jsonBody||'').substring(0,80));
  console.log('Salvar headers:', s.parameters.headerParameters.parameters.map(h=>h.name).join(', '));
}
const v = nodes.find(n=>n.name==='Verificar Buffer');
if (v) console.log('Verificar Buffer: query fields:', v.parameters.queryParameters.parameters.map(p=>p.name).join(', '));

// Check connections
console.log('\nConnections detail:');
Object.entries(conn).forEach(([k, v]) => {
  try {
    const t = v.main?.[0]?.map?.(t => t.node).join(', ') || 'none';
    console.log(`  ${k} → ${t}`);
  } catch(e) {
    console.log(`  ${k} → ERROR: ${e.message}`);
  }
});
db.close();
