const http = require('http');
const API_KEY = 'N8N_API_KEY_REMOVED';
const WF_ID = 'WFCRM001chat01';

function api(method, path, body, contentType) {
  return new Promise((resolve, reject) => {
    const headers = { 'X-N8N-API-KEY': API_KEY };
    if (contentType) headers['Content-Type'] = contentType;
    else headers['Content-Type'] = 'application/json';
    const opts = { hostname: 'localhost', port: 5678, path: '/api/v1/' + path, method, headers };
    const req = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ s: res.statusCode, b: d.substring(0,300) }));
    });
    req.on('error', reject);
    if (body !== undefined) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function testWebhook() {
  return new Promise((resolve) => {
    const body = 'user_id=41fcf46d-e02a-439e-93af-bfc8ae614809&name=Kevin&message=ping';
    const opts = {
      hostname: 'localhost', port: 5678, path: '/webhook/crm-chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    const req = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ s: res.statusCode, b: d.substring(0,300) }));
    });
    req.on('error', reject => resolve({ s: 0, b: reject.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Waiting for n8n...');
  for (let i = 0; i < 30; i++) {
    try { const h = await api('GET', 'workflows/' + WF_ID); if (h.s === 200) break; } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('Deactivating...');
  const deact = await api('POST', 'workflows/' + WF_ID + '/deactivate', {});
  console.log('  ->', deact.s);
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Activating...');
  const act = await api('POST', 'workflows/' + WF_ID + '/activate', {});
  console.log('  ->', act.s);
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Testing webhook...');
  const test = await testWebhook();
  console.log('  ->', test.s, test.b.substring(0, 200));
  
  if (test.s === 200) {
    console.log('\nSUCCESS: Webhook working! Path: /webhook/crm-chat');
    process.exit(0);
  } else {
    console.log('\nFAILED');
    process.exit(1);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
