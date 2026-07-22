const Database = require('better-sqlite3');
const db = new Database('n8n/data/database.sqlite');

console.log("=== TABLES ===");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name).join(', '));

console.log("\n=== WORKFLOWS ===");
const workflows = db.prepare("SELECT id, name, active, createdAt, updatedAt FROM workflow_entity").all();
workflows.forEach(w => console.log(w));

console.log("\n=== WORKFLOW NODES ===");
const nodes = db.prepare("SELECT id, workflowId, name, type, typeVersion, position FROM node_entity").all();
nodes.forEach(n => console.log(n));

console.log("\n=== WEBHOOKS ===");
const webhooks = db.prepare("SELECT id, workflowId, path, method FROM webhook_entity").all();
webhooks.forEach(w => console.log(w));

console.log("\n=== CREDENTIALS ===");
const creds = db.prepare("SELECT id, name, type FROM credentials_entity").all();
creds.forEach(c => console.log(c));