const http = require('http');
const API_KEY = 'N8N_API_KEY_REMOVED';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 5678, path: '/api/v1/' + path, method, headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' } };
    const req = http.request(opts, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } }); });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Just try to deactivate via POST
  const deact = await api('POST', 'workflows/WFCRM001chat01/deactivate');
  console.log('Deactivate status:', deact.s, JSON.stringify(deact.b).substring(0, 200));
  
  // Then activate again
  const act = await api('POST', 'workflows/WFCRM001chat01/activate');
  console.log('Activate status:', act.s, JSON.stringify(act.b).substring(0, 200));
  
  // Check webhook_entity in DB
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync('n8n/data/database.sqlite');
  const wh = db.prepare('SELECT * FROM webhook_entity').all();
  console.log('Webhook entities after toggle:', JSON.stringify(wh, null, 2));
  db.close();
  
  // Test webhook
  const body = 'user_id=41fcf46d-e02a-439e-93af-bfc8ae614809&name=Kevin&message=teste';
  const test = await api('POST', 'webhook/wh_1784659859808/crm-chat', body);
  console.log('Test status:', test.s, JSON.stringify(test.b).substring(0, 300));
}
main().catch(console.error);
