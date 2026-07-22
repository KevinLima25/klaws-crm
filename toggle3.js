const http = require('http');
const API_KEY = 'N8N_API_KEY_REMOVED';

function api(method, path, body, contentType) {
  return new Promise((resolve, reject) => {
    const headers = { 'X-N8N-API-KEY': API_KEY };
    if (contentType !== false) { headers['Content-Type'] = contentType || 'application/json'; }
    const opts = { hostname: 'localhost', port: 5678, path: '/api/v1/' + path, method, headers };
    const req = http.request(opts, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { console.log(res.statusCode, d.substring(0,300)); resolve({ s: res.statusCode, b: d }); }); });
    req.on('error', reject);
    if (body !== undefined) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== Deactivate (no body, no content-type) ===');
  await api('POST', 'workflows/WFCRM001chat01/deactivate', undefined, false);
  console.log('\n=== Activate (no body, no content-type) ===');
  await api('POST', 'workflows/WFCRM001chat01/activate', undefined, false);
  
  // Check webhook_entity
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync('n8n/data/database.sqlite');
  const wh = db.prepare('SELECT * FROM webhook_entity').all();
  console.log('\nWebhooks:', JSON.stringify(wh));
  db.close();
  
  // Test webhook
  console.log('\n=== Test webhook ===');
  await api('POST', 'webhook/crm-chat', 'user_id=41fcf46d-e02a-439e-93af-bfc8ae614809&name=Kevin&message=teste', 'application/x-www-form-urlencoded');
}
main().catch(console.error);
