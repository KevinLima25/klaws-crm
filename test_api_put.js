const http = require('http');

const API_KEY = 'N8N_API_KEY_REMOVED';

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: `/api/v1/${path}`,
      method,
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // GET current workflow
  const wf = await apiRequest('GET', 'workflows/WFCRM001chat01');
  if (wf.status !== 200) { console.log('Error:', wf.body); return; }
  
  console.log('Workflow properties:');
  Object.keys(wf.body).forEach(k => {
    const v = wf.body[k];
    const type = Array.isArray(v) ? `array(${v.length})` : typeof v;
    console.log(`  ${k}: ${type} = ${type === 'string' ? JSON.stringify(v).substring(0, 80) : ''}`);
  });
  
  // Try just sending nodes + connections
  console.log('\n\nTrying minimal PUT with only nodes + connections...');
  const minimal = {
    name: wf.body.name,
    nodes: wf.body.nodes,
    connections: wf.body.connections,
    settings: wf.body.settings || {},
    staticData: wf.body.staticData || null,
    tags: wf.body.tags || []
  };
  
  const update = await apiRequest('PUT', 'workflows/WFCRM001chat01', minimal);
  console.log(`Update status: ${update.status}`);
  console.log('Response:', JSON.stringify(update.body).substring(0, 500));
}

main().catch(console.error);
