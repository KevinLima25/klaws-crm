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
  // Create a NEW test workflow via API
  const newWf = await api('POST', 'workflows', {
    name: "Test API Webhook",
    nodes: [
      { id: "wh1", name: "Webhook", type: "n8n-nodes-base.webhook", typeVersion: 2, position: [0, 300], parameters: { httpMethod: "POST", path: "api-test", options: {}, responseMode: "lastNode" } },
      { id: "set1", name: "Set", type: "n8n-nodes-base.set", typeVersion: 1, position: [300, 300], parameters: { values: { string: [{ name: "response", value: "ok" }] }, options: {} } }
    ],
    connections: { Webhook: { main: [[{ node: "Set", type: "main", index: 0 }]] } },
    settings: {}
  });
  console.log('Create status:', newWf.s);
  if (newWf.s === 200) {
    console.log('Workflow ID:', newWf.b.id);
    console.log('Name:', newWf.b.name);
    
    // Activate
    const act = await api('POST', 'workflows/' + newWf.b.id + '/activate');
    console.log('Activate status:', act.s);
    
    // Test webhook
    const test = await api('POST', 'webhook/api-test');
    console.log('Test status:', test.s);
    console.log('Test response:', typeof test.b === 'string' ? test.b.substring(0, 200) : JSON.stringify(test.b).substring(0, 200));
  } else {
    console.log('Create error:', JSON.stringify(newWf.b).substring(0, 500));
  }
}
main().catch(console.error);
