const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('n8n/data/database.sqlite');

const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
let nodes = JSON.parse(wf.nodes);
let conn = JSON.parse(wf.connections);

// Reconnect Buffer -> Switch
conn['Salvar no Buffer'] = { main: [[{ node: 'Master Router (Switch)', type: 'main', index: 0 }]] };

// Switch routing:
// [0] image -> OCR_PENDING (Imagem)
// [1] pdf -> OCR_PENDING (PDF)
// [2] audio -> AUDIO_PENDING
// [3] video -> VIDEO_PENDING
// [4] fallback/text -> DADOS
conn['Master Router (Switch)'] = {
  main: [
    [{ node: 'OCR_PENDING (Imagem)', type: 'main', index: 0 }],
    [{ node: 'OCR_PENDING (PDF)', type: 'main', index: 0 }],
    [{ node: 'AUDIO_PENDING', type: 'main', index: 0 }],
    [{ node: 'VIDEO_PENDING', type: 'main', index: 0 }],
    [{ node: 'DADOS', type: 'main', index: 0 }]
  ]
};

// Ensure placeholder nodes connect somewhere (they end here - response comes from lastNode)
// Convert OCR_PENDING nodes to use output mode so they return directly

// Update Switch to use newer format with explicit dataType, value1, rules array and fallbackOutput
const sn = nodes.find(n => n.type === 'n8n-nodes-base.switch');
sn.parameters = {
  dataType: 'string',
  value1: '={{ $json.route }}',
  rules: [
    { outputKey: 'image', label: 'Imagem', conditions: { string: [{ value1: '={{ $json.route }}', operation: 'equal', value2: 'image' }] } },
    { outputKey: 'pdf', label: 'PDF', conditions: { string: [{ value1: '={{ $json.route }}', operation: 'equal', value2: 'pdf' }] } },
    { outputKey: 'audio', label: 'Audio', conditions: { string: [{ value1: '={{ $json.route }}', operation: 'equal', value2: 'audio' }] } },
    { outputKey: 'video', label: 'Video', conditions: { string: [{ value1: '={{ $json.route }}', operation: 'equal', value2: 'video' }] } }
  ],
  fallbackOutput: 'text'
};

const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const vid = crypto.randomUUID();

db.exec('BEGIN TRANSACTION');
try {
  db.prepare("INSERT INTO workflow_history (versionId,workflowId,authors,nodes,connections,name,createdAt,updatedAt,autosaved) VALUES(?,?,?,?,?,?,?,?,1)").run(vid, 'WFCRM001chat01', 'api', JSON.stringify(nodes), JSON.stringify(conn), wf.name, now, now);
  db.prepare("UPDATE workflow_entity SET nodes=?,connections=?,versionId=?,activeVersionId=?,updatedAt=?,versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?").run(JSON.stringify(nodes), JSON.stringify(conn), vid, vid, now, 'WFCRM001chat01');
  db.exec('COMMIT');
  console.log('Deployed with new Switch format. Version:', vid);
} catch(e) { db.exec('ROLLBACK'); console.error(e.message); }
db.close();
