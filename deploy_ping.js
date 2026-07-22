const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');
const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const vid = crypto.randomUUID();

// Create a minimal workflow: Webhook → Set → end
const workflow = {
  name: "Ping Test",
  nodes: [
    {
      id: "wh-" + Date.now(),
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [0, 300],
      parameters: {
        httpMethod: "POST",
        path: "ping",
        options: {},
        responseMode: "lastNode"
      }
    },
    {
      id: "set-" + Date.now(),
      name: "Set",
      type: "n8n-nodes-base.set",
      typeVersion: 1,
      position: [300, 300],
      parameters: {
        values: { string: [{ name: "response", value: "pong" }] },
        options: {}
      }
    }
  ],
  connections: { Webhook: { main: [[{ node: "Set", type: "main", index: 0 }]] } }
};

db.prepare("DELETE FROM webhook_entity").run();
db.prepare("INSERT INTO workflow_history (versionId, workflowId, authors, nodes, connections, name, createdAt, updatedAt, autosaved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)").run(vid, 'WFCRM001chat01', 'api', JSON.stringify(workflow.nodes), JSON.stringify(workflow.connections), workflow.name, now, now);
db.prepare("UPDATE workflow_entity SET name=?, nodes=?, connections=?, versionId=?, activeVersionId=?, updatedAt=?, versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?").run(workflow.name, JSON.stringify(workflow.nodes), JSON.stringify(workflow.connections), vid, vid, now, 'WFCRM001chat01');
console.log('Deployed Ping Test. Restart n8n.');
db.close();
