const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const hist = db.prepare("SELECT versionId, name, autosaved, createdAt, nodes FROM workflow_history WHERE workflowId='WFCRM001chat01' ORDER BY createdAt").all();
hist.forEach(h => {
  const nodeCount = typeof h.nodes === 'string' ? JSON.parse(h.nodes).length : (h.nodes ? h.nodes.length : 0);
  console.log(h.versionId.substring(0,8), 'name:', h.name ? '"'+h.name+'"' : '(empty)', 'autosaved:', h.autosaved, 'nodes:', nodeCount, 'at:', h.createdAt);
});
db.close();
