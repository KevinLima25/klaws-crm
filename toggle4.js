const http = require('http');
const API_KEY = 'N8N_API_KEY_REMOVED';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };
    const opts = { hostname: 'localhost', port: 5678, path: '/api/v1/' + path, method, headers };
    const req = http.request(opts, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { console.log(res.statusCode, d.substring(0,500)); resolve({ s: res.statusCode, b: d }); }); });
    req.on('error', reject);
    if (body !== undefined) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Try with empty JSON body
  console.log('=== Deactivate with {} ===');
  await api('POST', 'workflows/WFCRM001chat01/deactivate', {});
  
  console.log('\n=== Activate with {} ===');
  await api('POST', 'workflows/WFCRM001chat01/activate', {});
  
  // Check webhook_entity
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync('n8n/data/database.sqlite');
  const wh = db.prepare('SELECT * FROM webhook_entity').all();
  console.log('\nWebhooks:', JSON.stringify(wh));
  db.close();
  
  // Test
  console.log('\n=== Test ===');
  const body = 'user_id=41fcf46d-e02a-439e-93af-bfc8ae614809&name=Kevin&message=teste';
  const t = await api('POST', 'webhook/crm-chat', body);
  console.log('Test:', t.b.substring(0,300));
}
main().catch(console.error);
