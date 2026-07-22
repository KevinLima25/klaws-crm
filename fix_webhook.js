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
  // Get current workflow
  const get = await api('GET', 'workflows/WFCRM001chat01');
  console.log('Get status:', get.s);
  if (get.s !== 200) { console.log('Error:', JSON.stringify(get.b).substring(0,300)); return; }
  
  const wf = get.b;
  const whNode = wf.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  
  // Set a proper webhookId
  const newId = 'wh_' + Date.now();
  whNode.webhookId = newId;
  
  // Update path to include webhookId (or not, n8n should handle it)
  whNode.parameters.path = 'crm-chat';
  
  console.log('Updating webhook node with webhookId:', newId);
  console.log('Node:', JSON.stringify({name: whNode.name, webhookId: whNode.webhookId, path: whNode.parameters.path}));
  
  // Update workflow
  const update = await api('PUT', 'workflows/WFCRM001chat01', wf);
  console.log('Update status:', update.s);
  if (update.s !== 200) { console.log('Error:', JSON.stringify(update.b).substring(0,500)); return; }
  
  // Deactivate
  const deact = await api('POST', 'workflows/WFCRM001chat01/deactivate');
  console.log('Deactivate status:', deact.s);
  
  // Activate
  const act = await api('POST', 'workflows/WFCRM001chat01/activate');
  console.log('Activate status:', act.s);
  
  // Test webhook
  const test = await api('POST', 'webhook/' + newId + '/crm-chat', { user_id: '41fcf46d-e02a-439e-93af-bfc8ae614809', name: 'Kevin', message: 'teste' });
  console.log('Test status:', test.s);
  console.log('Response:', JSON.stringify(test.b).substring(0, 300));
}
main().catch(console.error);
