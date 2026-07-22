const crypto = require('crypto');
const fs = require('fs');
const AK = fs.readFileSync('crm/.env.local', 'utf-8').match(/^N8N_API_KEY=(.+)$/m)[1];
const http = require('http');
function nid() { return crypto.randomUUID().replace(/-/g, '').substring(0, 32); }
function api(m, p, b) {
  return new Promise(r => {
    const o = { hostname: 'localhost', port: 5678, path: '/api/v1/' + p, method: m, headers: { 'X-N8N-API-KEY': AK, 'Content-Type': 'application/json' } };
    const q = http.request(o, rp => { let d = ''; rp.on('data', c => d += c); rp.on('end', () => r({ s: rp.statusCode, b: d })); });
    q.on('error', e => r({ s: 0, b: e.message })); if (b) q.write(b); q.end();
  });
}
async function main() {
  // Check if WAHA workflow already exists
  let r = await api('GET', 'workflows');
  const list = JSON.parse(r.b);
  const existing = list.data.find(w => w.name.includes('WAHA'));
  if (existing) { console.log('WAHA workflow already exists: ' + existing.id); return; }

  const nodes = [
    { id: nid(), name: 'Webhook WAHA', typeVersion: 1, type: 'n8n-nodes-base.webhook', position: [250, 300], parameters: { httpMethod: 'POST', path: 'waha', responseMode: 'lastNode', options: {} } },
    { id: nid(), name: 'Router: Chat?', typeVersion: 1, type: 'n8n-nodes-base.if', position: [450, 300], parameters: { conditions: { string: [{ value1: '={{ $json.body.message || $json.body.text || $json.body.caption || "" }}', operation: 'notEmpty', value2: '' }] } } },
    { id: nid(), name: 'Encaminhar CRM Chat', typeVersion: 4.2, type: 'n8n-nodes-base.httpRequest', position: [650, 200], parameters: { method: 'POST', url: '={{ $json._n8n_webhook_url || "http://localhost:5678/webhook/crm-chat" }}', authentication: 'none', sendBody: true, bodyParameters: { parameters: [{ name: 'message', value: '={{ $json.body.message || $json.body.text || $json.body.caption || $json.body }}', type: 'string' }, { name: 'user_id', value: '={{ $json.body.from || "waha" }}', type: 'string' }, { name: 'source', value: 'whatsapp', type: 'string' }] } } },
    { id: nid(), name: 'Response', typeVersion: 1, type: 'n8n-nodes-base.respondToWebhook', position: [850, 200], parameters: { respondWith: 'json', options: {}, responseBodyType: 'firstItemJson', responseData_simple: [{ id: '1', name: 'status', value: 'received', type: 'string' }] } },
    { id: nid(), name: 'Ignorar', typeVersion: 3.4, type: 'n8n-nodes-base.set', position: [650, 400], parameters: { assignments: { assignments: [{ id: '1', name: 'status', value: 'ignored_no_text', type: 'string' }] }, options: {}, includeOtherFields: true } }
  ];
  const conn = {
    'Webhook WAHA': { main: [[{ node: 'Router: Chat?', type: 'main', index: 0 }]] },
    'Router: Chat?': { main: [[{ node: 'Encaminhar CRM Chat', type: 'main', index: 0 }], [{ node: 'Ignorar', type: 'main', index: 0 }]] },
    'Encaminhar CRM Chat': { main: [[{ node: 'Response', type: 'main', index: 0 }]] },
    'Response': { main: [[]] },
    'Ignorar': { main: [[]] }
  };
  const wf = { name: 'WAHA Webhook', nodes, connections: conn, settings: { executionOrder: 'v1' }, staticData: null };
  let r2 = await api('POST', 'workflows', JSON.stringify(wf));
  if (r2.s === 200) { const b = JSON.parse(r2.b); console.log('WAHA workflow created: ' + b.id); await api('POST', 'workflows/' + b.id + '/activate', '{}'); console.log('Activated'); } else { console.log('Create failed: ' + r2.s + ' ' + r2.b.substring(0, 200)); }
  
  // Export backup
  let r3 = await api('GET', 'workflows/' + JSON.parse(r2.b).id);
  const full = JSON.parse(r3.b);
  const exportData = { id: full.id, name: full.name, active: full.active, nodes: full.nodes, connections: full.connections, settings: full.settings };
  fs.mkdirSync('backups/workflows', { recursive: true });
  fs.writeFileSync('backups/workflows/WAHA_Webhook.json', JSON.stringify(exportData, null, 2));
  console.log('Backup saved: backups/workflows/WAHA_Webhook.json');
}
main().catch(e => { console.error(e); process.exit(1); });
