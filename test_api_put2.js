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
  const wf = await apiRequest('GET', 'workflows/WFCRM001chat01');
  if (wf.status !== 200) { console.log('Error:', wf.body); return; }
  
  console.log('Settings:', JSON.stringify(wf.body.settings, null, 2));
  console.log('StaticData:', JSON.stringify(wf.body.staticData, null, 2));
  
  // Try without settings
  console.log('\n\nTry PUT without settings...');
  const minimal = {
    name: wf.body.name,
    nodes: wf.body.nodes,
    connections: wf.body.connections,
  };
  const update = await apiRequest('PUT', 'workflows/WFCRM001chat01', minimal);
  console.log(`Status: ${update.status}`);
  console.log('Response:', JSON.stringify(update.body).substring(0, 500));
}

main().catch(console.error);
