const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('n8n/data/database.sqlite');

const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
let nodes = JSON.parse(wf.nodes);
let conn = JSON.parse(wf.connections);

// Bypass Switch: connect Buffer directly to DADOS (text flow)
conn['Salvar no Buffer'] = { main: [[{ node: 'DADOS', type: 'main', index: 0 }]] };

// Keep Switch disconnected but still present in workflow (don't delete nodes)
// Remove Switch connections (keep it orphaned for now)
delete conn['Master Router (Switch)'];

const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const vid = crypto.randomUUID();

db.exec('BEGIN TRANSACTION');
try {
  db.prepare("INSERT INTO workflow_history (versionId,workflowId,authors,nodes,connections,name,createdAt,updatedAt,autosaved) VALUES(?,?,?,?,?,?,?,?,1)").run(vid, 'WFCRM001chat01', 'api', JSON.stringify(nodes), JSON.stringify(conn), wf.name, now, now);
  db.prepare("UPDATE workflow_entity SET nodes=?,connections=?,versionId=?,activeVersionId=?,updatedAt=?,versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?").run(JSON.stringify(nodes), JSON.stringify(conn), vid, vid, now, 'WFCRM001chat01');
  db.exec('COMMIT');
  console.log('Bypassed Switch. Buffer -> DADOS directly. Version:', vid);
} catch(e) { db.exec('ROLLBACK'); console.error(e.message); }
db.close();
