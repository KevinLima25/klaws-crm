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
  // Get latest execution
  const execs = await api('GET', 'executions?workflowId=WFCRM001chat01&limit=1');
  if (execs.s === 200 && execs.b.data && execs.b.data.length > 0) {
    const id = execs.b.data[0].id;
    const detail = await api('GET', 'executions/' + id);
    console.log('Execution', id, 'detail:');
    console.log(JSON.stringify(detail.b, null, 2).substring(0, 3000));
  }
}
main().catch(console.error);
