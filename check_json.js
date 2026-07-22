const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const wf = db.prepare("SELECT id, nodes FROM workflow_entity WHERE id='WFCRM001chat01'").get();

// Try to parse the JSON
try {
  const parsed = JSON.parse(wf.nodes);
  console.log('Valid JSON! Nodes:', parsed.length);
  const codeNode = parsed.find(n => n.type === 'n8n-nodes-base.code');
  if (codeNode) {
    console.log('Code node found:', codeNode.name);
    console.log('Code length:', codeNode.parameters.jsCode.length);
    console.log('Code preview:', codeNode.parameters.jsCode.substring(0, 200));
  }
} catch (e) {
  console.log('JSON parse error:', e.message);
  console.log('Position:', e.message.match(/position (\d+)/)?.[1]);
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  console.log('Context:', JSON.stringify(wf.nodes.substring(Math.max(0,pos-50), pos+50)));
}
db.close();
