const http = require('http');
const API_KEY = 'N8N_API_KEY_REMOVED';
const WF_ID = 'WFCRM001ocr01';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };
    const opts = { hostname: 'localhost', port: 5678, path: '/api/v1/' + path, method, headers };
    const req = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ s: res.statusCode, b: d.substring(0,500) }));
    });
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Waiting for n8n...');
  for (let i = 0; i < 30; i++) {
    try { const h = await api('GET', 'workflows/' + WF_ID); if (h.s === 200) { console.log('Workflow found'); break; } } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('Deactivating...');
  const deact = await api('POST', 'workflows/' + WF_ID + '/deactivate', {});
  console.log('  ->', deact.s, deact.b);
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Activating...');
  const act = await api('POST', 'workflows/' + WF_ID + '/activate', {});
  console.log('  ->', act.s, act.b);
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Testing webhook...');
  const body = 'user_id=test&file_data=test';
  const opts = { hostname: 'localhost', port: 5678, path: '/webhook/agent-ocr', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
  const test = await new Promise((resolve) => {
    const req = http.request(opts, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({s:res.statusCode,b:d})); });
    req.on('error', e => resolve({s:0,b:e.message}));
    req.write(body);
    req.end();
  });
  console.log('  ->', test.s, test.b.substring(0, 300));
  
  if (test.s === 200) {
    console.log('\nSUCCESS: Webhook working! Path: /webhook/agent-ocr');
    process.exit(0);
  } else {
    console.log('\nFAILED');
    process.exit(1);
  }
}
main().catch(e => { console.error(e); process.exit(1); });