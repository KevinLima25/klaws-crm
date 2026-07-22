const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');

// Update the ACTIVE version in workflow_history to match the nodes in workflow_entity
const wf = db.prepare("SELECT id, activeVersionId FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('Active version:', wf.activeVersionId);

// Get the current nodes from workflow_entity
const curWf = db.prepare("SELECT nodes FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const curNodes = typeof curWf.nodes === 'string' ? JSON.parse(curWf.nodes) : curWf.nodes;
const whNode = curNodes.find(n => n.type === 'n8n-nodes-base.webhook');
console.log('Current webhook node webhookId:', whNode.webhookId);

// Get the workflow_history entry for the active version
const hist = db.prepare("SELECT * FROM workflow_history WHERE workflowId='WFCRM001chat01' AND versionId=?").get(wf.activeVersionId);
if (hist) {
  const histNodes = typeof hist.nodes === 'string' ? JSON.parse(hist.nodes) : hist.nodes;
  const histWhNode = histNodes.find(n => n.type === 'n8n-nodes-base.webhook');
  console.log('History webhook node webhookId:', histWhNode ? histWhNode.webhookId : 'NOT FOUND');
  
  // Update history nodes to match
  if (histWhNode) {
    histWhNode.webhookId = whNode.webhookId;
    histWhNode.parameters.path = whNode.parameters.path;
    db.prepare("UPDATE workflow_history SET nodes=? WHERE workflowId='WFCRM001chat01' AND versionId=?").run(JSON.stringify(histNodes), wf.activeVersionId);
    console.log('Updated workflow_history version', wf.activeVersionId);
  }
}

// Verify
const hist2 = db.prepare("SELECT * FROM workflow_history WHERE workflowId='WFCRM001chat01' AND versionId=?").get(wf.activeVersionId);
const hist2Nodes = typeof hist2.nodes === 'string' ? JSON.parse(hist2.nodes) : hist2.nodes;
const hist2WhNode = hist2Nodes.find(n => n.type === 'n8n-nodes-base.webhook');
console.log('After update - History webhookId:', hist2WhNode.webhookId);

db.close();
