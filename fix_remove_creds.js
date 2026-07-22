const fs = require('fs');
const AK = fs.readFileSync('crm/.env.local', 'utf-8').match(/^N8N_API_KEY=(.+)$/m)[1];
const http = require('http');
function api(m, p, b) {
  return new Promise(r => {
    const o = { hostname: 'localhost', port: 5678, path: '/api/v1/' + p, method: m, headers: { 'X-N8N-API-KEY': AK, 'Content-Type': 'application/json' } };
    const q = http.request(o, rp => { let d = ''; rp.on('data', c => d += c); rp.on('end', () => r({ s: rp.statusCode, b: d })); });
    q.on('error', e => r({ s: 0, b: e.message })); if (b) q.write(b); q.end();
  });
}

async function main() {
  let r = await api('GET', 'workflows/WFCRM001chat01');
  const wf = JSON.parse(r.b);
  const bufferNode = wf.nodes.find(n => n.name === 'Salvar no Buffer');

  // Remove ALL Supabase-related code from the Code node.
  // Keep only data extraction + pass-through (preserving original input format).
  bufferNode.parameters.jsCode = [
    "const body = $json.body || $json;",
    "const user_id = body.user_id;",
    "const message = body.message || '';",
    "let file_name = body._file_name || body.file_name || null;",
    "let file_type = body._file_type || body.file_type || null;",
    "if (!file_name) {",
    "  const binKeys = Object.keys($binary || {});",
    "  if (binKeys.length > 0) {",
    "    const bin = $binary[binKeys[0]];",
    "    if (bin && bin.fileName) file_name = bin.fileName;",
    "    if (bin && bin.mimeType) file_type = bin.mimeType;",
    "  }",
    "}",
    "return $input.all();"
  ].join('\n');

  await api('POST', 'workflows/WFCRM001chat01/deactivate', '{}');
  await new Promise(r => setTimeout(r, 500));
  const dr = await api('PUT', 'workflows/WFCRM001chat01', JSON.stringify({
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings: { executionOrder: wf.settings?.executionOrder || 'v1' },
    staticData: wf.staticData || null
  }));
  console.log('Deploy:', dr.s === 200 ? 'OK' : 'FAIL ' + dr.b.substring(0, 200));
  if (dr.s !== 200) process.exit(1);
  await api('POST', 'workflows/WFCRM001chat01/activate', '{}');
  console.log('Activated');

  // Test
  const body = JSON.stringify({ message: 'teste sem cred', user_id: 'test', source: 'web_crm' });
  const rt = await new Promise(r => {
    const o = { hostname: 'localhost', port: 5678, path: '/webhook/crm-chat', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 60000 };
    const q = http.request(o, rp => { let d = ''; rp.on('data', c => d += c); rp.on('end', () => r({ s: rp.statusCode, b: d })); });
    q.on('error', e => r({ s: 0, b: JSON.stringify({ error: e.message }) })); q.write(body); q.end();
  });
  console.log('CRM Chat test:', rt.s, rt.b.substring(0, 200));
}
main().catch(e => { console.error(e); process.exit(1); });
