const http = require('http');
const API_KEY = 'N8N_API_KEY_REMOVED';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 5678, path: '/api/v1/' + path, method, headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' } };
    const req = http.request(opts, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { console.log('Status:', res.statusCode, 'Body:', d.substring(0,500)); try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } }); });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== Deactivate ===');
  await api('POST', 'workflows/WFCRM001chat01/deactivate');
  console.log('\n=== Activate ===');
  await api('POST', 'workflows/WFCRM001chat01/activate');
  console.log('\n=== Test webhook ===');
  const body = 'user_id=41fcf46d-e02a-439e-93af-bfc8ae614809&name=Kevin&message=teste';
  const test = await api('POST', 'webhook/crm-chat', body);
  console.log('Test result:', test.s, JSON.stringify(test.b).substring(0, 300));
}
main().catch(console.error);
