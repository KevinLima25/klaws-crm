const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('n8n/data/database.sqlite');

const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
let nodes = JSON.parse(wf.nodes);
let conn = JSON.parse(wf.connections);

// EXACTLY 3 rules like original
const sn = nodes.find(n => n.type === 'n8n-nodes-base.switch');
sn.parameters = { rules: { values: [
  { value1: '={{ $json.body._file_type || $json.body.file_type || "text" }}', operation: 'equal', value2: 'image' },
  { value1: '={{ $json.body._file_type || $json.body.file_type || "text" }}', operation: 'equal', value2: 'pdf' },
  { value1: '={{ $json.body._file_type || $json.body.file_type || "text" }}', operation: 'equal', value2: 'audio' }
] } };

conn['Salvar no Buffer'] = { main: [[{ node: 'Master Router (Switch)', type: 'main', index: 0 }]] };
conn['Master Router (Switch)'] = {
  main: [
    [{ node: 'OCR_PENDING (Imagem)', type: 'main', index: 0 }],
    [{ node: 'OCR_PENDING (PDF)', type: 'main', index: 0 }],
    [{ node: 'AUDIO_PENDING', type: 'main', index: 0 }],
    [{ node: 'DADOS', type: 'main', index: 0 }]
  ]
};

const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const vid = crypto.randomUUID();

db.exec('BEGIN TRANSACTION');
try {
  db.prepare("INSERT INTO workflow_history (versionId,workflowId,authors,nodes,connections,name,createdAt,updatedAt,autosaved) VALUES(?,?,?,?,?,?,?,?,1)").run(vid, 'WFCRM001chat01', 'api', JSON.stringify(nodes), JSON.stringify(conn), wf.name, now, now);
  db.prepare("UPDATE workflow_entity SET nodes=?,connections=?,versionId=?,activeVersionId=?,updatedAt=?,versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?").run(JSON.stringify(nodes), JSON.stringify(conn), vid, vid, now, 'WFCRM001chat01');
  db.exec('COMMIT');
  console.log('Deployed: 3 rules (original count). Version:', vid);
} catch(e) { db.exec('ROLLBACK'); console.error(e.message); }
db.close();
