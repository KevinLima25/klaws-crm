const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Get workflow info
const wf = db.prepare("SELECT id, name, active, activeVersionId, versionId FROM workflow_entity WHERE id='WFCRM001chat01'").get();
console.log('Workflow:', JSON.stringify(wf, null, 2));

// Get the active version from workflow_history using activeVersionId
if (wf && wf.activeVersionId) {
  const wh = db.prepare("SELECT * FROM workflow_history WHERE versionId=?").get(wf.activeVersionId);
  if (wh) {
    let nodes = wh.nodes;
    if (typeof nodes === 'string') nodes = JSON.parse(nodes);
    const salvar = nodes.find(n => n.name === 'Salvar no Buffer');
    if (salvar) {
      console.log('\nSalvar no Buffer node (active version):');
      console.log('  type:', salvar.type);
      console.log('  typeVersion:', salvar.typeVersion);
      console.log('  parameters:', JSON.stringify(salvar.parameters, null, 2));
    }
    
    // Also check the CRM Webhook node
    const webhook = nodes.find(n => n.name === 'CRM Webhook');
    if (webhook) {
      console.log('\nCRM Webhook node (active version):');
      console.log('  type:', webhook.type);
      console.log('  typeVersion:', webhook.typeVersion);
      console.log('  webhookId:', webhook.webhookId);
    }
  }
}

// Also check the draft nodes (in workflow_entity) for comparison
const draftNodes = db.prepare("SELECT nodes FROM workflow_entity WHERE id='WFCRM001chat01'").get();
if (draftNodes && draftNodes.nodes) {
  let nodes = typeof draftNodes.nodes === 'string' ? JSON.parse(draftNodes.nodes) : draftNodes.nodes;
  const salvarDraft = nodes.find(n => n.name === 'Salvar no Buffer');
  if (salvarDraft) {
    console.log('\nSalvar no Buffer node (draft):');
    console.log('  type:', salvarDraft.type);
    console.log('  typeVersion:', salvarDraft.typeVersion);
    console.log('  parameters:', JSON.stringify(salvarDraft.parameters, null, 2));
  }
}

db.close();
