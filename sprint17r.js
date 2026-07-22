const { DatabaseSync } = require('node:sqlite');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const db = new DatabaseSync('n8n/data/database.sqlite');
const envContent = fs.readFileSync(path.resolve('crm/.env.local'), 'utf-8');
const N8N_API_KEY = (envContent.match(/^N8N_API_KEY=(.+)$/m) || [])[1];
if (!N8N_API_KEY) throw new Error('N8N_API_KEY nao encontrada em crm/.env.local. Gere uma em n8n Settings > API.');
const AK = N8N_API_KEY;

function nid() { return crypto.randomUUID().replace(/-/g, '').substring(0, 32); }

const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001comp01'").get();
let nodes = JSON.parse(wf.nodes);
let conn = JSON.parse(wf.connections);

// ===== STEP 1: Mark orphaned nodes as candidates for removal =====
const orphaned = [
  'GERAR HASH SHA256', 'GERAR ID COMPROVANTE', 'VERIFICAR DUPLICIDADE',
  '\u00C9 DUPLICADO?', 'MOVER PARA DUPLICADOS', 'RESPOSTA DUPLICADO',
  'MOVER PARA PROCESSANDO', 'GERAR METADATA', 'SALVAR METADATA',
  'MOVER PARA PROCESSADOS'
];
orphaned.forEach(name => {
  const n = nodes.find(x => x.name === name);
  if (n) n.notes = 'Candidato à remoção — Sprint 1.7R: substituído por Write Binary File + Set nativos';
});

// ===== STEP 2: Update VALIDAR ARQUIVO to emit tem_binario flag + fix JSON body check =====
const valNode = nodes.find(n => n.name === 'VALIDAR ARQUIVO');
valNode.parameters.jsCode = [
  "const items=$input.all();if(!items||!items.length)return[{json:{erro:'sem itens'}}];",
  "const item=items[0];",
  "let buf=null;let fileName='';let mimeType='';let binaryKey='';",
  "const binKeys=Object.keys($binary||{});",
  "if(binKeys.length>0){binaryKey=binKeys[0];const bin=$binary[binaryKey];if(bin){if(Buffer.isBuffer(bin.data))buf=bin.data;else if(typeof bin.data==='string')buf=Buffer.from(bin.data,'base64');fileName=bin.fileName||'';mimeType=bin.mimeType||'';}}",
  "if(!buf&&item.binary){const ibk=Object.keys(item.binary);if(ibk.length>0){if(!binaryKey)binaryKey=ibk[0];const ib=item.binary[ibk[0]];if(ib&&ib.data){if(Buffer.isBuffer(ib.data))buf=ib.data;else buf=Buffer.from(ib.data,'base64');fileName=fileName||ib.fileName||'';}}}",
  "const body=item.json.body||item.json||{};fileName=fileName||body.fileName||body.file_name||body._file_name||'';",
  "const ext=fileName?fileName.toLowerCase().split('.').pop():'';",
  "const validExts=['pdf','jpg','jpeg','png'];const erros=[];",
  "if(!buf&&!fileName)erros.push('Nenhum arquivo recebido');",
  "if(fileName&&!validExts.includes(ext))erros.push('Extensao invalida: '+ext);",
  "let hash='';let fileSize=0;",
  "if(buf){fileSize=buf.length;var s=0;var arr=new Uint8Array(buf.buffer||buf);for(var i=0;i<arr.length;i++){s=(s*31+arr[i])>>>0;}hash=s.toString(16).padStart(8,'0');}",
  "const caminho_completo=buf?'/home/node/.n8n-files/comprovantes/entrada/'+Date.now()+'_'+(fileName||'arquivo'):'';",
  "return[{json:{valido:erros.length===0,erros,arquivo_nome:fileName,arquivo_tipo:mimeType,fileSize,hash_sha256:hash,tem_binario:binKeys.length>0,binario_key:binaryKey,caminho_completo:caminho_completo},binary:item.binary}];"
].join('\n');

// ===== STEP 3: Update RESPOSTA SUCESSO to Sprint 1.7R format =====
const respOk = nodes.find(n => n.name === 'RESPOSTA SUCESSO');
respOk.parameters.includeOtherFields = true;
respOk.parameters.options = { stripBinary: true };
respOk.parameters.assignments.assignments = [
  { id: '1', name: 'status', value: 'success', type: 'string' },
  { id: '2', name: 'arquivo_original', value: '={{ $json.arquivo_original || $json.arquivo_nome || "" }}', type: 'string' },
  { id: '3', name: 'arquivo_salvo', value: '={{ $json.arquivo_salvo || $json.fileName || $json.caminho_completo || "" }}', type: 'string' },
  { id: '4', name: 'timestamp', value: '={{ Date.now() }}', type: 'number' }
];

// ===== STEP 4: Add new native nodes (skip if already exist) =====
function addNode(n) {
  if (!nodes.find(x => x.name === n.name)) nodes.push(n);
}

// 4a. TEM BINARIO? IF node — uses json flag instead of $binary (more reliable across runner)
addNode({
  id: nid(),
  name: 'TEM BINARIO?',
  typeVersion: 1,
  type: 'n8n-nodes-base.if',
  position: [660, 300],
  parameters: {
    conditions: {
      boolean: [{
        value1: '={{ $json.tem_binario }}',
        operation: 'equal',
        value2: true
      }]
    }
  }
});

// 4b. Write Binary File (native) — update params if exists, else create
let wbfNode = nodes.find(x => x.name === 'Write Binary File');
if (wbfNode) {
  wbfNode.parameters.dataPropertyName = '={{ $json.binario_key || "file" }}';
  wbfNode.parameters.fileName = '={{ $json.caminho_completo }}';
  wbfNode.parameters.options = {};
  wbfNode.typeVersion = 1;
  wbfNode.type = 'n8n-nodes-base.writeBinaryFile';
} else {
  nodes.push({
    id: nid(),
    name: 'Write Binary File',
    typeVersion: 1,
    type: 'n8n-nodes-base.writeBinaryFile',
    position: [860, 200],
    parameters: {
      dataPropertyName: '={{ $json.binario_key || "file" }}',
      fileName: '={{ $json.caminho_completo }}',
      options: {}
    }
  });
}

// 4c. Set Metadados (native Set node)
addNode({
  id: nid(),
  name: 'Set Metadados',
  typeVersion: 3.4,
  type: 'n8n-nodes-base.set',
  position: [860, 400],
  parameters: {
    includeOtherFields: true,
    options: { stripBinary: true },
    assignments: {
      assignments: [
        { id: '1', name: 'arquivo_original', value: '={{ $json.arquivo_nome || "" }}', type: 'string' },
        { id: '2', name: 'arquivo_salvo', value: '={{ $json.fileName || $json.caminho_completo || "" }}', type: 'string' },
        { id: '3', name: 'timestamp', value: '={{ Date.now() }}', type: 'number' }
      ]
    }
  }
});

// ===== STEP 5: Replace connections with new simplified flow =====
conn = {
  'Webhook Comprovante': {
    main: [[{ node: 'VALIDAR ARQUIVO', type: 'main', index: 0 }]]
  },
  'VALIDAR ARQUIVO': {
    main: [[{ node: 'Valido?', type: 'main', index: 0 }]]
  },
  'Valido?': {
    main: [
      [{ node: 'TEM BINARIO?', type: 'main', index: 0 }],
      [{ node: 'RESPOSTA ERRO', type: 'main', index: 0 }]
    ]
  },
  'TEM BINARIO?': {
    main: [
      [{ node: 'Write Binary File', type: 'main', index: 0 }],
      [{ node: 'Set Metadados', type: 'main', index: 0 }]
    ]
  },
  'Write Binary File': {
    main: [[{ node: 'Set Metadados', type: 'main', index: 0 }]]
  },
  'Set Metadados': {
    main: [[{ node: 'RESPOSTA SUCESSO', type: 'main', index: 0 }]]
  }
};

// ===== STEP 6: Helper: API call =====
function api(method, p, body) {
  return new Promise(resolve => {
    const opts = {
      hostname: 'localhost', port: 5678,
      path: '/api/v1/' + p, method,
      headers: { 'X-N8N-API-KEY': AK, 'Content-Type': 'application/json' }
    };
    const r = http.request(opts, rp => {
      let d = '';
      rp.on('data', c => d += c);
      rp.on('end', () => resolve({ s: rp.statusCode, b: d }));
    });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (body) r.write(body);
    r.end();
  });
}

// ===== STEP 7: Helper: multipart test =====
function sendMultipart(filePath, fileName, extraFields) {
  return new Promise(resolve => {
    const boundary = '----B' + Math.random().toString(36).substring(2);
    const fc = fs.readFileSync(filePath);
    const parts = [];
    if (extraFields) {
      Object.keys(extraFields).forEach(k => {
        parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="' + k + '"\r\n\r\n' + extraFields[k] + '\r\n');
      });
    }
    parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + fileName + '"\r\nContent-Type: application/octet-stream\r\n\r\n');
    const body = Buffer.concat([
      Buffer.from(parts.join('')), fc,
      Buffer.from('\r\n--' + boundary + '--\r\n')
    ]);
    const opts = {
      hostname: 'localhost', port: 5678,
      path: '/webhook/comprovante', method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length
      }
    };
    const r = http.request(opts, rp => {
      let d = '';
      rp.on('data', c => d += c);
      rp.on('end', () => resolve({ s: rp.statusCode, body: d }));
    });
    r.on('error', e => resolve({ s: 0, body: e.message }));
    r.write(body);
    r.end();
  });
}

// ===== STEP 8: Helper: JSON test =====
function sendJson(data) {
  return new Promise(resolve => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'localhost', port: 5678,
      path: '/webhook/comprovante', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const r = http.request(opts, rp => {
      let d = '';
      rp.on('data', c => d += c);
      rp.on('end', () => resolve({ s: rp.statusCode, body: d }));
    });
    r.on('error', e => resolve({ s: 0, body: e.message }));
    r.write(body);
    r.end();
  });
}

// ===== STEP 9: Main =====
async function main() {
  // --- Deploy ---
  console.log('=== DEPLOY ===');
  let r = await api('POST', 'workflows/WFCRM001comp01/deactivate', '{}');
  console.log('Deactivate:', r.s);

  r = await api('PUT', 'workflows/WFCRM001comp01', JSON.stringify({
    name: wf.name,
    nodes,
    connections: conn,
    settings: JSON.parse(wf.settings || '{}'),
    staticData: wf.staticData ? JSON.parse(wf.staticData) : null
  }));
  console.log('PUT:', r.s, r.b.substring(0, 200));

  r = await api('POST', 'workflows/WFCRM001comp01/activate', '{}');
  console.log('Activate:', r.s);

  await new Promise(r => setTimeout(r, 1000));

  // --- Tests ---
  const sampleDir = 'n8n/data/test_samples';
  const pass = [];
  const fail = [];

  function check(n, ok, detail) {
    console.log((ok ? '  PASS' : '  FAIL') + ' | ' + n + (detail ? ' | ' + detail : ''));
    (ok ? pass : fail).push(n);
  }

  console.log('\n=== TEST 1: PDF válido ===');
  const r1 = await sendMultipart(path.join(sampleDir, 'test.pdf'), 'comprovante.pdf', { user_id: 'test' });
  const j1 = JSON.parse(r1.body);
  check('PDF valido', j1.status === 'success' && j1.arquivo_salvo && j1.timestamp,
    'status=' + j1.status + ' salvo=' + (j1.arquivo_salvo || 'vazio'));

  console.log('\n=== TEST 2: JPG válido ===');
  const r2 = await sendMultipart(path.join(sampleDir, 'test.jpg'), 'foto.jpg', { user_id: 'test' });
  const j2 = JSON.parse(r2.body);
  check('JPG valido', j2.status === 'success' && j2.arquivo_salvo,
    'status=' + j2.status);

  console.log('\n=== TEST 3: PNG válido ===');
  const r3 = await sendMultipart(path.join(sampleDir, 'test.png'), 'imagem.png', { user_id: 'test' });
  const j3 = JSON.parse(r3.body);
  check('PNG valido', j3.status === 'success' && j3.arquivo_salvo,
    'status=' + j3.status);

  console.log('\n=== TEST 4: Sem extensão ===');
  const r4 = await sendMultipart(path.join(sampleDir, 'noext'), 'noext', { user_id: 'test' });
  const j4 = JSON.parse(r4.body);
  check('Sem extensao', j4.status === 'erro' && j4.erro && j4.erro.includes('Extensao'),
    'status=' + j4.status + ' erro=' + (j4.erro || ''));

  console.log('\n=== TEST 5: .exe inválido ===');
  const r5 = await sendMultipart(path.join(sampleDir, 'test.exe'), 'virus.exe', { user_id: 'test' });
  const j5 = JSON.parse(r5.body);
  check('.exe invalido', j5.status === 'erro' && j5.erro && j5.erro.includes('Extensao'),
    'status=' + j5.status + ' erro=' + (j5.erro || ''));

  console.log('\n=== TEST 6: Sem arquivo (JSON) ===');
  const r6 = await sendJson({ user_id: 'test' });
  const j6 = JSON.parse(r6.body);
  check('Sem arquivo', j6.status === 'erro' && j6.erro && j6.erro.includes('Nenhum arquivo'),
    'status=' + j6.status + ' erro=' + (j6.erro || ''));

  console.log('\n=== TEST 7: JSON com file_name (CRM Chat path) ===');
  const r7 = await sendJson({ user_id: 'test', file_name: 'boleto.pdf', file_type: 'pdf' });
  const j7 = JSON.parse(r7.body);
  check('JSON file_name', j7.status === 'success' && j7.arquivo_original === 'boleto.pdf',
    'status=' + j7.status + ' original=' + (j7.arquivo_original || ''));

  // --- Verify file on disk ---
  console.log('\n=== FILE ON DISK ===');
  let disco = [];
  try {
    const out = require('child_process').execSync('docker exec n8n ls /home/node/.n8n-files/comprovantes/entrada/', { stdio: 'pipe', timeout: 5000 }).toString().trim();
    disco = out ? out.split('\n').filter(Boolean) : [];
  } catch(e) { console.log('  (docker exec error: ' + e.message.substring(0,80) + ')'); }
  check('Arquivo salvo no disco', disco.length >= 3,
    disco.length + ' files: ' + disco.join(', '));

  // --- Summary ---
  console.log('\n=====================');
  console.log('RESULTADO FINAL:');
  console.log('  Pass:', pass.length + '/' + (pass.length + fail.length));
  console.log('  Fail:', fail.length + '/' + (pass.length + fail.length));
  if (fail.length > 0) {
    console.log('  Failed tests:', fail.join(', '));
    process.exit(1);
  } else {
    console.log('  All tests passed!');
  }
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
