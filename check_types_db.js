const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\User\\Downloads\\Waha N&N\\n8n\\data\\database.sqlite');

// Check the n8n node registry for available HTTP Request typeVersions
const types = db.prepare("SELECT DISTINCT json_extract(value, '$.name') as name FROM (SELECT key, value FROM (SELECT key, value FROM json_each((SELECT value FROM node_type_metadata WHERE name = 'n8n-nodes-base.httpRequest'))) UNION ALL SELECT key, value FROM (SELECT key, value FROM json_each((SELECT value FROM node_type_metadata WHERE name = 'n8n-nodes-base.httpRequest')))) WHERE key = 'typeVersion'").all();
console.log('Available typeVersions:', types.map(t => t.name));

// Check node_type_metadata structure
const sampleTypes = db.prepare("SELECT name FROM node_type_metadata LIMIT 20").all();
console.log('\nTypes registered:', sampleTypes.map(t => t.name).join(', '));

db.close();
