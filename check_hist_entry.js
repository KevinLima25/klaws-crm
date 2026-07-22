const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const hist = db.prepare("SELECT * FROM workflow_history WHERE workflowId='WFCRM001chat01' AND versionId='edc19c54-f15a-442f-b2aa-21d34c707b50'").get();
if (hist) {
  console.log('History entry:');
  console.log('  versionId:', hist.versionId);
  console.log('  name:', `"${hist.name}"`);
  console.log('  autosaved:', hist.autosaved);
  console.log('  createdAt:', hist.createdAt);
  const nodeCount = typeof hist.nodes === 'string' ? JSON.parse(hist.nodes).length : hist.nodes.length;
  console.log('  nodes count:', nodeCount);
}
db.close();
