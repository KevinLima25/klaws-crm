const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');

// Get current workflow data
const wf = db.prepare("SELECT nodes, connections FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const nodes = typeof wf.nodes === 'string' ? JSON.parse(wf.nodes) : JSON.parse(JSON.stringify(wf.nodes));
const conns = typeof wf.connections === 'string' ? JSON.parse(wf.connections) : JSON.parse(JSON.stringify(wf.connections));

// Remove Wait node and reconnect CRM Webhook -> DADOS
const waitName = 'Wait';
const waitIdx = nodes.findIndex(n => n.name === waitName);
if (waitIdx >= 0) {
  // Get wait node ID
  const waitNode = nodes[waitIdx];
  // Remove from nodes array
  nodes.splice(waitIdx, 1);
  // Update connections: CRM Webhook -> DADOS
  const whConns = conns['CRM Webhook'];
  if (whConns && whConns.main && whConns.main[0] && whConns.main[0][0]) {
    whConns.main[0][0].node = 'DADOS';
  }
  // Remove Wait connections entry
  delete conns[waitName];
  
  // Also update workflow_history
  const activeVersionId = db.prepare("SELECT activeVersionId FROM workflow_entity WHERE id='WFCRM001chat01'").get().activeVersionId;
  const hist = db.prepare("SELECT * FROM workflow_history WHERE workflowId='WFCRM001chat01' AND versionId=?").get(activeVersionId);
  if (hist) {
    const histNodes = typeof hist.nodes === 'string' ? JSON.parse(hist.nodes) : JSON.parse(JSON.stringify(hist.nodes));
    const histConns = typeof hist.connections === 'string' ? JSON.parse(hist.connections) : JSON.parse(JSON.stringify(hist.connections));
    const histWaitIdx = histNodes.findIndex(n => n.name === waitName);
    if (histWaitIdx >= 0) {
      histNodes.splice(histWaitIdx, 1);
      const histWhConns = histConns['CRM Webhook'];
      if (histWhConns && histWhConns.main && histWhConns.main[0] && histWhConns.main[0][0]) {
        histWhConns.main[0][0].node = 'DADOS';
      }
      delete histConns[waitName];
      db.prepare("UPDATE workflow_history SET nodes=?, connections=? WHERE workflowId='WFCRM001chat01' AND versionId=?").run(JSON.stringify(histNodes), JSON.stringify(histConns), activeVersionId);
      console.log('Updated workflow_history');
    }
  }
  
  // Update workflow_entity
  db.prepare("UPDATE workflow_entity SET nodes=?, connections=? WHERE id='WFCRM001chat01'").run(JSON.stringify(nodes), JSON.stringify(conns));
  console.log('Removed Wait node. New path: CRM Webhook -> DADOS');
} else {
  console.log('Wait node not found');
}

db.close();
