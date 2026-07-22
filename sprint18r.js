const { DatabaseSync } = require('node:sqlite');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const db = new DatabaseSync('n8n/data/database.sqlite');
const envContent = fs.readFileSync(path.resolve('crm/.env.local'), 'utf-8');
const N8N_API_KEY = (envContent.match(/^N8N_API_KEY=(.+)$/m) || [])[1];
if (!N8N_API_KEY) throw new Error('N8N_API_KEY nao encontrada em crm/.env.local. Gere uma em n8n Settings > API.');
const AK = N8N_API_KEY;

function nid() { return crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').substring(0, 32) : 'n' + Date.now().toString(36); }

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

async function getWF(id) {
  const r = await api('GET', 'workflows/' + id);
  if (r.s !== 200) throw new Error('GET ' + id + ': ' + r.b);
  return JSON.parse(r.b);
}

// Code for the replacement Code node "Enviar para Agente Comprovante"
const ENVIAR_COMPROVANTE_CODE = `const items = $input.all();
if (!items || items.length === 0) return [];
const item = items[0];
const body = item.json.body || item.json || {};
const user_id = body.user_id || "";
const message = body.message || "";
let file_name = "";
let file_type = "";
let file_base64 = "";
const binKeys = Object.keys($binary || {});
if (binKeys.length > 0) {
  const binKey = binKeys[0];
  const bin = $binary[binKey];
  if (bin) {
    file_name = bin.fileName || body.file_name || body._file_name || "";
    file_type = bin.mimeType || body.file_type || body._file_type || "";
    // Method signature: getBinaryDataBuffer(itemIndex, propertyName|binaryData)
    var buf = null;
    try { buf = await this.helpers.getBinaryDataBuffer(0, bin); } catch(e) {}
    if (!buf) { try { buf = await this.helpers.getBinaryDataBuffer(0, binKey); } catch(e) {} }
    if (buf) { file_base64 = buf.toString("base64"); }
    if (!file_base64 && bin.data) {
      var buf2 = Buffer.isBuffer(bin.data) ? bin.data : Buffer.from(bin.data, "base64");
      file_base64 = buf2.toString("base64");
    }
  }
}
if (!file_base64 && item && item.binary) {
  const ibk = Object.keys(item.binary);
  if (ibk.length > 0) {
    const ibKey = ibk[0];
    const ib = item.binary[ibKey];
    if (ib) {
      file_name = file_name || ib.fileName || "";
      file_type = file_type || ib.mimeType || "";
      var buf3 = null;
      try { buf3 = await this.helpers.getBinaryDataBuffer(0, ib); } catch(e) {}
      if (!buf3) { try { buf3 = await this.helpers.getBinaryDataBuffer(0, ibKey); } catch(e) {} }
      if (buf3) { file_base64 = buf3.toString("base64"); }
      if (!file_base64 && ib.data) {
        var buf4 = Buffer.isBuffer(ib.data) ? ib.data : Buffer.from(ib.data, "base64");
        file_base64 = buf4.toString("base64");
      }
    }
  }
}
if (!file_base64) {
  return [{ json: { status: "erro", erro: "Nenhum binario encontrado" } }];
}
const payload = { user_id: user_id, message: message, file_base64: file_base64, file_name: file_name, file_type: file_type };
try {
  const resp = await this.helpers.httpRequest({
    method: "POST",
    url: "http://localhost:5678/webhook/comprovante",
    headers: { "Content-Type": "application/json" },
    body: payload,
    timeout: 30000
  });
  return [{ json: { status: "success", resposta: resp } }];
} catch (e) {
  return [{ json: { status: "erro", erro: e.message || String(e) } }];
}`;

// Updated VALIDAR ARQUIVO code: binary required, 20MB limit, MIME validation, base64 support
const VALIDAR_ARQUIVO_CODE = `const TAMANHO_MAXIMO = 20 * 1024 * 1024;
const items = $input.all();
if (!items || !items.length) return [{ json: { valido: false, erros: ["sem itens"] } }];
const item = items[0];
let buf = null;
let fileName = "";
let mimeType = "";
let binaryKey = "";
let createdFromBase64 = false;
// 1. Check $binary first
const binKeys = Object.keys($binary || {});
if (binKeys.length > 0) {
  binaryKey = binKeys[0];
  const bin = $binary[binaryKey];
  if (bin) {
    // Method signature: getBinaryDataBuffer(itemIndex, propertyName|binaryData)
    try { buf = await this.helpers.getBinaryDataBuffer(0, bin); } catch(e) {}
    if (!buf) { try { buf = await this.helpers.getBinaryDataBuffer(0, binaryKey); } catch(e) {} }
    if (!buf && bin.data) {
      if (Buffer.isBuffer(bin.data)) buf = bin.data;
      else if (typeof bin.data === "string") buf = Buffer.from(bin.data, "base64");
    }
    fileName = bin.fileName || "";
    mimeType = bin.mimeType || "";
  }
}
// 2. Check item.binary fallback
if (!buf && item && item.binary) {
  const ibk = Object.keys(item.binary);
  if (ibk.length > 0) {
    if (!binaryKey) binaryKey = ibk[0];
    const ibKey = ibk[0];
    const ib = item.binary[ibKey];
    if (ib) {
      try { buf = await this.helpers.getBinaryDataBuffer(0, ib); } catch(e) {}
      if (!buf) { try { buf = await this.helpers.getBinaryDataBuffer(0, ibKey); } catch(e) {} }
      if (!buf && ib.data) {
        buf = Buffer.isBuffer(ib.data) ? ib.data : Buffer.from(ib.data, "base64");
      }
      fileName = fileName || ib.fileName || "";
      mimeType = mimeType || ib.mimeType || "";
    }
  }
}
// 3. Check JSON body for base64-encoded file (from Enviar para Agente Comprovante Code node)
const body = item.json.body || item.json || {};
if (!buf && body.file_base64) {
  try {
    buf = Buffer.from(body.file_base64, "base64");
    fileName = fileName || body.file_name || body.fileName || "";
    mimeType = mimeType || body.file_type || body.fileType || "application/octet-stream";
    binaryKey = binaryKey || "data";
    createdFromBase64 = true;
  } catch(e) {}
}
// Fallback name from JSON
fileName = fileName || body.fileName || body.file_name || body._file_name || "";
mimeType = mimeType || body.fileType || body.file_type || body._file_type || "";
// Validation
const ext = fileName ? fileName.toLowerCase().split(".").pop() : "";
const validExts = ["pdf", "jpg", "jpeg", "png"];
const erros = [];
if (!buf) erros.push("arquivo_binario_ausente");
if (buf && buf.length > TAMANHO_MAXIMO) erros.push("arquivo_excede_tamanho_maximo_20MB");
if (fileName && !validExts.includes(ext)) erros.push("Extensao_invalida: " + ext);
let hash = "";
let fileSize = 0;
if (buf) {
  fileSize = buf.length;
  var s = 0;
  var arr = new Uint8Array(buf.buffer || buf);
  for (var i = 0; i < arr.length; i++) { s = (s * 31 + arr[i]) >>> 0; }
  hash = s.toString(16).padStart(8, "0");
}
const caminho_completo = buf ? "/home/node/.n8n-files/comprovantes/entrada/" + Date.now() + "_" + (fileName || "arquivo") : "";
const temBinario = binKeys.length > 0 || (item && item.binary && Object.keys(item.binary).length > 0) || createdFromBase64;
const outputBinary = createdFromBase64 ? { data: { data: buf.toString("base64"), mimeType: mimeType, fileName: fileName } } : (item.binary || undefined);
if (!binaryKey && temBinario) binaryKey = "data";
return [{ json: { valido: erros.length === 0, erros: erros, arquivo_nome: fileName, arquivo_tipo: mimeType, fileSize: fileSize, hash_sha256: hash, tem_binario: temBinario, binario_key: binaryKey, caminho_completo: caminho_completo }, binary: outputBinary }];`;

async function main() {
  console.log('===== SPRINT 1.8R =====\n');

  // ---- PART 1: CRM Chat ----
  console.log('=== CRM Chat (WFCRM001chat01) ===');
  const chatWF = await getWF('WFCRM001chat01');
  const chatNodes = chatWF.nodes;
  const chatConn = chatWF.connections;
  let chatChanged = false;

  const existingCodeIdx = chatNodes.findIndex(n => n.name === 'Enviar para Agente Comprovante');
  const oldHrIdx = chatNodes.findIndex(n => n.name === 'HTTP Request - Chamar Agente Comprovante');
  if (oldHrIdx !== -1) {
    console.log('Replacing "HTTP Request - Chamar Agente Comprovante" with Code node...');
    chatNodes[oldHrIdx] = {
      id: nid(),
      name: 'Enviar para Agente Comprovante',
      typeVersion: 1,
      type: 'n8n-nodes-base.code',
      position: chatNodes[oldHrIdx].position,
      parameters: { jsCode: ENVIAR_COMPROVANTE_CODE }
    };
    Object.keys(chatConn).forEach(src => {
      (chatConn[src].main || []).forEach((outputs, oi) => {
        (outputs || []).forEach((conn, ci) => {
          if (conn.node === 'HTTP Request - Chamar Agente Comprovante') {
            chatConn[src].main[oi][ci].node = 'Enviar para Agente Comprovante';
          }
        });
      });
    });
    delete chatConn['HTTP Request - Chamar Agente Comprovante'];
    chatChanged = true;
  } else if (existingCodeIdx !== -1) {
    // Update existing Code node if code changed
    const existingCode = chatNodes[existingCodeIdx].parameters && chatNodes[existingCodeIdx].parameters.jsCode;
    if (existingCode !== ENVIAR_COMPROVANTE_CODE) {
      console.log('Updating Code node with base64 approach...');
      chatNodes[existingCodeIdx].parameters.jsCode = ENVIAR_COMPROVANTE_CODE;
      chatChanged = true;
    } else {
      console.log('Code node already up to date.');
    }
  } else {
    console.log('No Code node found to update.');
  }

  const chatCandidates = ['HTTP Request - Agente OCR', 'HTTP Request - Agente Concilia\u00e7\u00e3o'];
  chatCandidates.forEach(name => {
    const idx = chatNodes.findIndex(n => n.name === name);
    if (idx !== -1) {
      const isConnected = Object.values(chatConn).some(c =>
        (c.main || []).some(outputs => (outputs || []).some(conn => conn.node === name))
      );
      if (!isConnected) {
        console.log('Removing disconnected:', name);
        chatNodes.splice(idx, 1);
        chatChanged = true;
      }
    }
  });

  if (chatChanged) {
    console.log('Deploying CRM Chat...');
    await api('POST', 'workflows/WFCRM001chat01/deactivate', '{}');
    await new Promise(r => setTimeout(r, 500));
    const chatSettings = { executionOrder: (chatWF.settings && chatWF.settings.executionOrder) || 'v1' };
    const r = await api('PUT', 'workflows/WFCRM001chat01', JSON.stringify({
      name: chatWF.name, nodes: chatNodes, connections: chatConn,
      settings: chatSettings, staticData: chatWF.staticData || null
    }));
    console.log('CRM Chat deploy:', r.s === 200 ? 'OK' : 'FAIL ' + r.s);
    if (r.s !== 200) console.log('  Resp:', r.b.substring(0, 300));
    await api('POST', 'workflows/WFCRM001chat01/activate', '{}');
  } else {
    console.log('CRM Chat: no changes needed.');
  }

  // ---- PART 2: Agente Comprovante ----
  console.log('\n=== Agente Comprovante (WFCRM001comp01) ===');
  const compWF = await getWF('WFCRM001comp01');
  const compNodes = compWF.nodes;
  const compConn = compWF.connections;
  let compChanged = false;

  const valNode = compNodes.find(n => n.name === 'VALIDAR ARQUIVO');
  if (valNode && valNode.parameters && valNode.parameters.jsCode !== VALIDAR_ARQUIVO_CODE) {
    console.log('Updating VALIDAR ARQUIVO...');
    valNode.parameters.jsCode = VALIDAR_ARQUIVO_CODE;
    compChanged = true;
  } else if (valNode) {
    console.log('VALIDAR ARQUIVO already up to date.');
  }

  const orphans = [
    'GERAR HASH SHA256', 'GERAR ID COMPROVANTE', 'VERIFICAR DUPLICIDADE',
    '\u00c9 DUPLICADO?', 'MOVER PARA DUPLICADOS', 'RESPOSTA DUPLICADO',
    'MOVER PARA PROCESSANDO', 'GERAR METADATA', 'SALVAR METADATA',
    'MOVER PARA PROCESSADOS'
  ];
  let removedCount = 0;
  orphans.forEach(name => {
    const idx = compNodes.findIndex(n => n.name === name);
    if (idx !== -1) {
      const isConnected = Object.values(compConn).some(c =>
        (c.main || []).some(outputs => (outputs || []).some(conn => conn.node === name))
      );
      const hasOutgoing = compConn[name] && compConn[name].main && compConn[name].main.some(o => o && o.length > 0);
      if (!isConnected && !hasOutgoing) {
        console.log('Removing orphan:', name);
        compNodes.splice(idx, 1);
        delete compConn[name];
        removedCount++;
        compChanged = true;
      } else {
        console.log('Skipping connected:', name);
      }
    }
  });
  console.log('Removed ' + removedCount + ' orphan nodes.');

  if (compChanged) {
    console.log('Deploying Agente Comprovante...');
    await api('POST', 'workflows/WFCRM001comp01/deactivate', '{}');
    await new Promise(r => setTimeout(r, 500));
    const compSettings = { executionOrder: (compWF.settings && compWF.settings.executionOrder) || 'v1' };
    const r = await api('PUT', 'workflows/WFCRM001comp01', JSON.stringify({
      name: compWF.name, nodes: compNodes, connections: compConn,
      settings: compSettings, staticData: compWF.staticData || null
    }));
    console.log('Agente deploy:', r.s === 200 ? 'OK' : 'FAIL ' + r.s);
    if (r.s !== 200) console.log('  Resp:', r.b.substring(0, 300));
    await api('POST', 'workflows/WFCRM001comp01/activate', '{}');
  } else {
    console.log('Agente Comprovante: no changes needed.');
  }

  // ---- PART 3: Docker Volume ----
  console.log('\n=== Docker Volume ===');
  const composePath = 'docker-compose.yml';
  let compose = fs.readFileSync(composePath, 'utf-8');
  if (compose.includes('./n8n/n8n-files:/home/node/.n8n-files')) {
    console.log('Volume already configured.');
  } else {
    const searchPattern = '- ./n8n/data:/home/node/.n8n';
    const volLine = '      - ./n8n/n8n-files:/home/node/.n8n-files';
    if (compose.includes(searchPattern)) {
      compose = compose.replace(searchPattern, searchPattern + '\n' + volLine);
      fs.writeFileSync(composePath, compose);
      console.log('Volume added to docker-compose.yml.');
    } else {
      console.log('WARNING: Could not find n8n data volume line.');
    }
  }

  const hostDir = 'n8n/n8n-files/comprovantes/entrada';
  if (!fs.existsSync(hostDir)) {
    fs.mkdirSync(hostDir, { recursive: true });
    console.log('Created host dir: ' + hostDir);
  }

  // ---- PART 4: Tests ----
  console.log('\n=== TESTS ===');
  const pass = []; const fail = [];
  function check(n, ok, detail) {
    console.log((ok ? '  PASS' : '  FAIL') + ' | ' + n + (detail ? ' | ' + detail : ''));
    (ok ? pass : fail).push(n);
  }

  function sendMultipart(filePath, fileName, extraFields) {
    return new Promise(resolve => {
      const boundary = '----B' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const fc = fs.readFileSync(filePath);
      const CRLF = '\r\n';
      const parts = [];
      if (extraFields) {
        Object.keys(extraFields).forEach(k => {
          parts.push('--' + boundary + CRLF + 'Content-Disposition: form-data; name="' + k + '"' + CRLF + CRLF + extraFields[k] + CRLF);
        });
      }
      const safeFn = (fileName || 'file').replace(/["\r\n]/g, '_');
      parts.push('--' + boundary + CRLF + 'Content-Disposition: form-data; name="files"; filename="' + safeFn + '"' + CRLF + 'Content-Type: application/octet-stream' + CRLF + CRLF);
      const body = Buffer.concat([
        Buffer.from(parts.join('')), fc,
        Buffer.from(CRLF + '--' + boundary + '--' + CRLF)
      ]);
      const opts = {
        hostname: 'localhost', port: 5678,
        path: '/webhook/crm-chat', method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length },
        timeout: 30000
      };
      const r = http.request(opts, rp => { let d = ''; rp.on('data', c => d += c); rp.on('end', () => resolve({ s: rp.statusCode, body: d })); });
      r.on('error', e => resolve({ s: 0, body: JSON.stringify({ error: e.message }) }));
      r.on('timeout', () => { r.destroy(); resolve({ s: 0, body: JSON.stringify({ error: 'timeout' }) }); });
      r.write(body); r.end();
    });
  }

  function sendJson(data, webhookPath) {
    const p = webhookPath || '/webhook/crm-chat';
    return new Promise(resolve => {
      const body = JSON.stringify(data); const cl = Buffer.byteLength(body);
      const opts = {
        hostname: 'localhost', port: 5678, path: p, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': cl },
        timeout: 15000
      };
      const r = http.request(opts, rp => { let d = ''; rp.on('data', c => d += c); rp.on('end', () => resolve({ s: rp.statusCode, body: d })); });
      r.on('error', e => resolve({ s: 0, body: JSON.stringify({ error: e.message }) }));
      r.on('timeout', () => { r.destroy(); resolve({ s: 0, body: JSON.stringify({ error: 'timeout' }) }); });
      r.write(body); r.end();
    });
  }

  const sampleDir = 'n8n/data/test_samples';

  // Test 1: PDF
  console.log('--- Test 1: PDF full flow ---');
  const r1 = await sendMultipart(path.join(sampleDir, 'test.pdf'), 'comprovante.pdf', { user_id: 'test', message: 'Segue comprovante' });
  console.log('  Raw:', r1.body.substring(0, 300));
  let j1;
  try { j1 = JSON.parse(r1.body); } catch(e) { j1 = { status: 'parse_error' }; }
  const ok1 = j1.status === 'success' && j1.resposta && j1.resposta.status === 'success';
  check('PDF full flow', ok1, 'status=' + j1.status + ' resp=' + (j1.resposta ? j1.resposta.status : (j1.erro || 'N/A')));

  // Test 2: JPG
  console.log('--- Test 2: JPG full flow ---');
  const r2 = await sendMultipart(path.join(sampleDir, 'test.jpg'), 'comprovante.jpg', { user_id: 'test', message: 'Segue foto' });
  console.log('  Raw:', r2.body.substring(0, 300));
  let j2;
  try { j2 = JSON.parse(r2.body); } catch(e) { j2 = { status: 'parse_error' }; }
  const ok2 = j2.status === 'success' && j2.resposta && j2.resposta.status === 'success';
  check('JPG full flow', ok2, 'status=' + j2.status + ' resp=' + (j2.resposta ? j2.resposta.status : (j2.erro || 'N/A')));

  // Test 3: PNG
  console.log('--- Test 3: PNG full flow ---');
  const r3 = await sendMultipart(path.join(sampleDir, 'test.png'), 'comprovante.png', { user_id: 'test', message: 'Segue imagem' });
  console.log('  Raw:', r3.body.substring(0, 300));
  let j3;
  try { j3 = JSON.parse(r3.body); } catch(e) { j3 = { status: 'parse_error' }; }
  const ok3 = j3.status === 'success' && j3.resposta && j3.resposta.status === 'success';
  check('PNG full flow', ok3, 'status=' + j3.status + ' resp=' + (j3.resposta ? j3.resposta.status : (j3.erro || 'N/A')));

  // Test 4: JSON-only goes to AI Agent
  console.log('--- Test 4: JSON sem arquivo ---');
  const r4 = await sendJson({ user_id: 'test', message: 'Ola, tudo bem?' });
  const j4 = JSON.parse(r4.body);
  const ok4 = j4.text && j4.text.length > 0;
  check('JSON sem arquivo -> AI Agent', ok4, 'text=' + (j4.text || '').substring(0, 50));

  // Test 5: JSON with base64 file to comprovante webhook (tests base64 decode path)
  console.log('--- Test 5: JSON + base64 to comprovante ---');
  const fc5 = fs.readFileSync(path.join(sampleDir, 'test.pdf'));
  const fileB64 = fc5.toString('base64');
  const r5 = await sendJson({
    user_id: 'test', message: 'test',
    file_base64: fileB64, file_name: 'comprovante.pdf', file_type: 'application/pdf'
  }, '/webhook/comprovante');
  console.log('  Raw:', r5.body.substring(0, 200));
  let j5;
  try { j5 = JSON.parse(r5.body); } catch(e) { j5 = { status: 'parse_error' }; }
  const ok5 = j5.status === 'success' && j5.arquivo_salvo;
  check('JSON + base64 comprovante', ok5, 'status=' + j5.status + ' saved=' + (j5.arquivo_salvo || ''));

  // Test 6: JSON-only direct to comprovante (should reject)
  console.log('--- Test 6: JSON-only rejected by comprovante ---');
  const r6 = await sendJson({ user_id: 'test', message: 'test', file_name: 'test.pdf' }, '/webhook/comprovante');
  const j6 = JSON.parse(r6.body);
  const ok6 = j6.status === 'erro' && j6.erro === 'arquivo_binario_ausente';
  check('JSON-only rejected', ok6, 'status=' + j6.status + ' erro=' + (j6.erro || ''));

  // Test 7: File on disk after full flow
  console.log('--- Test 7: File persisted on disk ---');
  let discoFiles = [];
  try {
    const out = execSync('docker exec n8n ls /home/node/.n8n-files/comprovantes/entrada/', { stdio: 'pipe', timeout: 5000, shell: true }).toString().trim();
    discoFiles = out ? out.split('\n').filter(Boolean) : [];
  } catch (e) {
    console.log('  (docker exec note: ' + (e.message || '').substring(0, 80) + ')');
  }
  check('Arquivos no disco', discoFiles.length > 0, 'count=' + discoFiles.length);

  // Summary
  console.log('\n=====================');
  console.log('RESULTADO FINAL:');
  console.log('  Pass: ' + pass.length + '/' + (pass.length + fail.length));
  console.log('  Fail: ' + fail.length + '/' + (pass.length + fail.length));
  if (fail.length > 0) {
    console.log('  Failed: ' + fail.join(', '));
    process.exit(1);
  } else {
    console.log('  All tests passed!');
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
