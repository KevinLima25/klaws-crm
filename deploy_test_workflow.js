const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Build a minimal test workflow: Webhook → HTTP Request (simple GET to test if node works)
const workflow = {
  name: "Test HTTP Node",
  nodes: [
    {
      id: "webhook-test",
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [0, 300],
      parameters: {
        httpMethod: "POST",
        path: "test-http",
        options: {},
        responseMode: "responseNode",
        responseData: "allEntries",
        respondContinue: false
      }
    },
    {
      id: "http-test",
      name: "Simple GET",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [300, 300],
      parameters: {
        method: "GET",
        url: "https://httpbin.org/get",
        authentication: "noAuth",
        sendQuery: false,
        options: {}
      }
    },
    {
      id: "respond-test",
      name: "Responder",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1,
      position: [600, 300],
      parameters: {
        respondWith: "json",
        responseBodyType: "firstEntryJson",
        responseBodySnippet: "={{ $json | toJSON }}",
        options: {}
      }
    }
  ],
  connections: {
    Webhook: { main: [[{ node: "Simple GET", type: "main", index: 0 }]] },
    "Simple GET": { main: [[{ node: "Responder", type: "main", index: 0 }]] }
  }
};

const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const vid = crypto.randomUUID();

db.exec('BEGIN TRANSACTION');
try {
  // Update CRM Chat to test workflow
  db.prepare("INSERT INTO workflow_history (versionId, workflowId, authors, nodes, connections, name, createdAt, updatedAt, autosaved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)").run(vid, 'WFCRM001chat01', 'api', JSON.stringify(workflow.nodes), JSON.stringify(workflow.connections), workflow.name, now, now);
  db.prepare("UPDATE workflow_entity SET name=?, nodes=?, connections=?, versionId=?, activeVersionId=?, updatedAt=?, versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?").run(workflow.name, JSON.stringify(workflow.nodes), JSON.stringify(workflow.connections), vid, vid, now, 'WFCRM001chat01');
  db.exec('COMMIT');
  console.log('Test workflow deployed. versionId:', vid);
} catch(e) { db.exec('ROLLBACK'); console.error('Rollback:', e.message); }
db.close();
