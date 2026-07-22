const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const hist = db.prepare("SELECT versionId, createdAt, name FROM workflow_history WHERE workflowId='WFCRM001chat01' ORDER BY createdAt").all();
hist.forEach(h => console.log(h.versionId, h.createdAt, h.name));
db.close();
