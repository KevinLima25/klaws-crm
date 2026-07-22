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
  const get = await api('GET', 'workflows/WFCRM001chat01');
  console.log('Get status:', get.s);
  if (get.s !== 200) { return; }
  
  const wf = get.b;
  const whNode = wf.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  const newId = 'wh_' + Date.now();
  whNode.webhookId = newId;
  console.log('Set webhookId:', newId);
  
  // Only send expected properties
  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || {},
    staticData: wf.staticData,
    pinData: wf.pinData
  };
  
  const update = await api('PUT', 'workflows/WFCRM001chat01', payload);
  console.log('Update status:', update.s);
  if (update.s !== 200) { console.log('Error:', JSON.stringify(update.b).substring(0,500)); return; }
  
  console.log('Updated workflow name:', update.b.name);
  console.log('New versionId:', update.b.versionId);
  
  // Verify webhookId was saved
  const get2 = await api('GET', 'workflows/WFCRM001chat01');
  const whNode2 = get2.b.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  console.log('Verification - webhookId:', whNode2.webhookId);
}
main().catch(console.error);
