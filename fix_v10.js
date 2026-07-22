const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('n8n/data/database.sqlite');

const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
let nodes = JSON.parse(wf.nodes);
let conn = JSON.parse(wf.connections);

// Remove old Switch node
const switchIdx = nodes.findIndex(n => n.type === 'n8n-nodes-base.switch');
let switchRemoved = nodes.splice(switchIdx, 1)[0];

// Clean old connections
delete conn['Master Router (Switch)'];
delete conn['Salvar no Buffer'];
delete conn['OCR_PENDING (Imagem)'];
delete conn['OCR_PENDING (PDF)'];
delete conn.AUDIO_PENDING;
delete conn.VIDEO_PENDING;

function makeIF(name, expression, value2, trueTarget, falseTarget) {
  const id = crypto.randomUUID().replace(/-/g, '');
  return {
    id: id,
    name: name,
    typeVersion: 1,
    type: 'n8n-nodes-base.if',
    position: [400, 200 + Object.keys(conn).length * 100],
    parameters: {
      conditions: {
        string: [
          { value1: expression, operation: 'equal', value2: value2 }
        ]
      }
    }
  };
}

const routeExpr = '={{ $json.body._file_type || $json.body.file_type || "text" }}';

const ifImage = makeIF('Router: Imagem?', routeExpr, 'image', 'OCR_PENDING (Imagem)', 'Router: PDF?');
const ifPdf = makeIF('Router: PDF?', routeExpr, 'pdf', 'OCR_PENDING (PDF)', 'Router: Audio?');
const ifAudio = makeIF('Router: Audio?', routeExpr, 'audio', 'AUDIO_PENDING', 'Router: Video?');
const ifVideo = makeIF('Router: Video?', routeExpr, 'video', 'VIDEO_PENDING', 'DADOS');

[salvarBuf] = nodes.filter(n => n.name === 'Salvar no Buffer');
function findPos(name) {
  const n = nodes.find(nn => nn.name === name);
  return n ? n.position : [400, 400];
}

const p0 = findPos('Salvar no Buffer');
const p1 = [p0[0] + 200, p0[1]];
const p2 = [p1[0] + 200, p1[1]];
const p3 = [p2[0] + 200, p2[1]];
const p4 = [p3[0] + 200, p3[1]];

ifImage.position = p1;
ifPdf.position = p2;
ifAudio.position = p3;
ifVideo.position = p4;

// Use the placeholders' existing positions; offset if too close
function offsetPos(name, dx, dy) {
  const n = nodes.find(nn => nn.name === name);
  if (n) { n.position = [n.position[0] + dx, n.position[1] + dy]; }
}
offsetPos('OCR_PENDING (Imagem)', -100, -200);
offsetPos('OCR_PENDING (PDF)', -100, -100);
offsetPos('AUDIO_PENDING', -100, 0);
offsetPos('VIDEO_PENDING', -100, 100);

nodes.push(ifImage, ifPdf, ifAudio, ifVideo);

// Add placeholder -> webhook response connections so they don't break
const respNode = nodes.find(n => n.name === 'Webhook Response' || n.type === 'n8n-nodes-base.webhookResponse');
if (respNode) {
  ['OCR_PENDING (Imagem)', 'OCR_PENDING (PDF)', 'AUDIO_PENDING', 'VIDEO_PENDING'].forEach(nm => {
    if (!conn[nm]) conn[nm] = { main: [[{ node: respNode.name, type: 'main', index: 0 }]] };
  });
}

conn['Salvar no Buffer'] = { main: [[{ node: 'Router: Imagem?', type: 'main', index: 0 }]] };
conn['Router: Imagem?'] = {
  main: [
    [{ node: 'OCR_PENDING (Imagem)', type: 'main', index: 0 }],
    [{ node: 'Router: PDF?', type: 'main', index: 0 }]
  ]
};
conn['Router: PDF?'] = {
  main: [
    [{ node: 'OCR_PENDING (PDF)', type: 'main', index: 0 }],
    [{ node: 'Router: Audio?', type: 'main', index: 0 }]
  ]
};
conn['Router: Audio?'] = {
  main: [
    [{ node: 'AUDIO_PENDING', type: 'main', index: 0 }],
    [{ node: 'Router: Video?', type: 'main', index: 0 }]
  ]
};
conn['Router: Video?'] = {
  main: [
    [{ node: 'VIDEO_PENDING', type: 'main', index: 0 }],
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
  console.log('Deployed: IF chain. Version:', vid);
} catch(e) { db.exec('ROLLBACK'); console.error(e.message); }
db.close();
