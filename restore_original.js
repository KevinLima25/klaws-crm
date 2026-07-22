const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get the original workflow from version e5fb97a4 (the last known-good version)
const orig = db.prepare("SELECT * FROM workflow_history WHERE versionId='e5fb97a4-9123-4243-8f0e-0916f39d99eb'").get();
if (!orig) { console.log('Original version not found!'); db.close(); return; }

const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const vid = crypto.randomUUID();

// Restore the original workflow
db.exec('BEGIN TRANSACTION');
try {
  db.prepare("INSERT INTO workflow_history (versionId, workflowId, authors, nodes, connections, name, createdAt, updatedAt, autosaved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)").run(vid, 'WFCRM001chat01', 'api', orig.nodes, orig.connections, 'CRM Chat (Original)', now, now);
  db.prepare("UPDATE workflow_entity SET name='CRM Chat', nodes=?, connections=?, versionId=?, activeVersionId=?, updatedAt=?, versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?").run(orig.nodes, orig.connections, vid, vid, now, 'WFCRM001chat01');
  db.exec('COMMIT');
  console.log('Restored original workflow. versionId:', vid);
} catch(e) { db.exec('ROLLBACK'); console.error('Error:', e.message); }
db.close();
