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
  
  console.log('Full workflow keys:', Object.keys(wf.body));
  
  // Try with empty settings
  let test = {
    name: wf.body.name,
    nodes: wf.body.nodes,
    connections: wf.body.connections,
    settings: {},
    staticData: null,
    tags: []
  };
  let r = await apiRequest('PUT', 'workflows/WFCRM001chat01', test);
  console.log(`\nTest 1 (empty settings): ${r.status} -`, JSON.stringify(r.body).substring(0, 100));
  
  if (r.status === 200) {
    console.log('SUCCESS!');
    return;
  }
  
  // Try with original settings but without errors
  test.settings = wf.body.settings;
  r = await apiRequest('PUT', 'workflows/WFCRM001chat01', test);
  console.log(`\nTest 2 (original settings): ${r.status} -`, JSON.stringify(r.body).substring(0, 100));
  
  // The issue might be that settings has properties not in the schema
  // Let me remove properties one by one
  if (r.status !== 200) {
    // Try with just one known property
    test.settings = { executionOrder: 'v1' };
    r = await apiRequest('PUT', 'workflows/WFCRM001chat01', test);
    console.log(`\nTest 3 (minimal settings): ${r.status} -`, JSON.stringify(r.body).substring(0, 100));
  }
}

main().catch(console.error);
