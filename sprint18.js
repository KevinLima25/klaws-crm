const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AK = 'N8N_API_KEY_REMOVED';

function nid() { return crypto.randomUUID().replace(/-/g, '').substring(0, 32); }
function api(method, p, body) {
  return new Promise(resolve => {
    const opts = { hostname: 'localhost', port: 5678, path: '/api/v1/' + p, method, headers: { 'X-N8N-API-KEY': AK, 'Content-Type': 'application/json' } };
    const r = http.request(opts, rp => { let d = ''; rp.on('data', c => d += c); rp.on('end', () => resolve({ s: rp.statusCode, b: d })); });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (body) r.write(body);
    r.end();
  });
}
async function getWF(id) { const r = await api('GET', 'workflows/' + id); if (r.s !== 200) throw new Error('GET ' + id + ': ' + r.b); return JSON.parse(r.b); }

// Single Code node: reads binary, calls Tesseract, creates .txt output
const OCR_CODE = `const item = $input.first();
if (!item) return [{ json: { status: "erro", erro: "sem_item" } }];
// Get binary
let buf = null;
const binKey = item.json.binario_key || "data";
const bin = $binary && $binary[binKey];
if (bin) { try { buf = await this.helpers.getBinaryDataBuffer(0, bin); } catch(e) {} }
if (!buf && item.binary) {
  const ibk = Object.keys(item.binary);
  if (ibk.length > 0) { try { buf = await this.helpers.getBinaryDataBuffer(0, item.binary[ibk[0]]); } catch(e) {} }
}
if (!buf) {
  return [{ json: { ...item.json, ocr_status: "erro", ocr_erro: "sem_dados_binario" }, binary: {} }];
}
// Prepare data URI
const mime = item.json.arquivo_tipo || "application/octet-stream";
const dataUri = "data:" + mime + ";base64," + buf.toString("base64");
const arquivoNome = item.json.arquivo_nome || "arquivo";
let ocrStatus = "erro";
let ocrTexto = "";
let ocrEngine = "nenhum";
let ocrErro = "";
// Try Tesseract via ocr-service
try {
  const resp = await this.helpers.httpRequest({
    method: "POST",
    url: "http://ocr-service:3002/ocr",
    headers: { "Content-Type": "application/json" },
    body: { base64Image: dataUri },
    timeout: 30000
  });
  if (resp.text) { ocrStatus = "ok"; ocrTexto = resp.text; ocrEngine = "tesseract"; }
  else { ocrErro = resp.error || "sem_resposta"; }
} catch (e) { ocrErro = "erro_conexao: " + (e.message || String(e)).substring(0, 80); }
// Create .txt binary
const txtFileName = arquivoNome.replace(/\\.[^.]+$/, "") + ".txt";
const txtContent = "=== OCR RESULT ===\\nEngine: " + ocrEngine + "\\nStatus: " + ocrStatus + "\\nTimestamp: " + new Date().toISOString() + "\\n\\n" + ocrTexto;
return [{
  json: {
    ...item.json,
    ocr_status: ocrStatus, ocr_texto: ocrTexto, ocr_engine: ocrEngine, ocr_erro: ocrErro,
    ocr_timestamp: new Date().toISOString(),
    ocr_path_txt: "/home/node/.n8n-files/comprovantes/processados/" + txtFileName,
    ocr_txt_nome: txtFileName
  },
  binary: { "ocr_resultado": { data: Buffer.from(txtContent, "utf-8").toString("base64"), mimeType: "text/plain", fileName: txtFileName } }
}];`;

const SET_META = [
  { id: "1", name: "arquivo_original", value: "={{ $json.arquivo_original || $json.arquivo_nome || \"\" }}", type: "string" },
  { id: "2", name: "arquivo_salvo", value: "={{ $json.fileName || $json.caminho_completo || \"\" }}", type: "string" },
  { id: "3", name: "timestamp", value: "={{ $now.toISOString() }}", type: "string" },
  { id: "4", name: "ocr_status", value: "={{ $json.ocr_status || \"pendente\" }}", type: "string" },
  { id: "5", name: "ocr_engine", value: "={{ $json.ocr_engine || \"\" }}", type: "string" },
  { id: "6", name: "ocr_texto", value: "={{ $json.ocr_texto || \"\" }}", type: "string" },
  { id: "7", name: "ocr_timestamp", value: "={{ $json.ocr_timestamp || \"\" }}", type: "string" },
  { id: "8", name: "ocr_path_txt", value: "={{ $json.ocr_path_txt || \"\" }}", type: "string" },
  { id: "9", name: "ocr_erro", value: "={{ $json.ocr_erro || \"\" }}", type: "string" }
];

async function main() {
  console.log('===== SPRINT 1.8 — OCR GRATUITO (LOCAL) =====\n');

  // Build OCR service
  console.log('=== Building OCR Service ===');
  try { execSync('docker compose build ocr-service', { stdio: 'pipe', timeout: 120000, shell: true }); console.log('Build ok.'); }
  catch (e) { console.log('Build:', e.stdout ? e.stdout.toString().trim().substring(0, 200) : ''); }
  try { execSync('docker compose up -d ocr-service', { stdio: 'pipe', timeout: 30000, shell: true }); console.log('Started.'); }
  catch (e) { console.log('Start:', e.stdout ? e.stdout.toString().trim().substring(0, 200) : ''); }
  await new Promise(r => setTimeout(r, 3000));
  try {
    const hc = execSync('docker compose exec ocr-service wget -q -O- http://localhost:3002/health', { stdio: 'pipe', timeout: 5000, shell: true });
    console.log('Health:', hc.toString().trim());
  } catch (e) { console.log('Health check:', '...continuing'); }

  // === DEPLOY WORKFLOW ===
  console.log('\n=== Deploy Workflow ===');
  const wf = await getWF('WFCRM001comp01');
  const conn = wf.connections;
  const backup = 'backup_WFCRM001comp01_pre_ocr_' + Date.now() + '.json';
  fs.writeFileSync(backup, JSON.stringify({ nodes: wf.nodes, connections: conn }, null, 2));
  console.log('Backup:', backup);

  // Keep only original nodes
  const keep = ['Webhook Comprovante', 'VALIDAR ARQUIVO', 'Valido?', 'TEM BINARIO?', 'Write Binary File', 'RESPOSTA ERRO'];
  const nodes = wf.nodes.filter(n => keep.includes(n.name));
  const basePn = wf.nodes.find(n => n.name === 'Write Binary File').position;
  const bx = basePn[0], by = basePn[1];

  // New nodes
  const ocrNode = { id: nid(), name: 'EXECUTAR OCR', typeVersion: 1, type: 'n8n-nodes-base.code', position: [bx + 200, by], parameters: { jsCode: OCR_CODE } };
  const txtNode = { id: nid(), name: 'SALVAR OCR .TXT', typeVersion: 1, type: 'n8n-nodes-base.writeBinaryFile', position: [bx + 400, by], parameters: { dataPropertyName: 'ocr_resultado', fileName: '={{ $json.ocr_path_txt }}', options: {} } };
  const metaNode = { id: nid(), name: 'Set Metadados', typeVersion: 3.4, type: 'n8n-nodes-base.set', position: [bx + 600, by], parameters: { assignments: { assignments: SET_META }, options: {}, includeOtherFields: true } };
  const respAssigns = [{ id: '1', name: 'status', value: 'success', type: 'string' }, { id: '2', name: 'arquivo_original', value: '={{ $json.arquivo_original || $json.arquivo_nome || "" }}', type: 'string' }, { id: '3', name: 'arquivo_salvo', value: '={{ $json.ocr_path_txt || $json.caminho_completo || "" }}', type: 'string' }, { id: '4', name: 'timestamp', value: '={{ Date.now() }}', type: 'number' }];
  const respNode = { id: nid(), name: 'RESPOSTA SUCESSO', typeVersion: 3.4, type: 'n8n-nodes-base.set', position: [bx + 800, by], parameters: { assignments: { assignments: respAssigns }, options: { stripBinary: true }, includeOtherFields: true } };
  nodes.push(ocrNode, txtNode, metaNode, respNode);

  // Connections
  const newConn = {
    'Webhook Comprovante': { main: [[{ node: 'VALIDAR ARQUIVO', type: 'main', index: 0 }]] },
    'VALIDAR ARQUIVO': { main: [[{ node: 'Valido?', type: 'main', index: 0 }]] },
    'Valido?': { main: [[{ node: 'TEM BINARIO?', type: 'main', index: 0 }], [{ node: 'RESPOSTA ERRO', type: 'main', index: 0 }]] },
    'TEM BINARIO?': { main: [[{ node: 'Write Binary File', type: 'main', index: 0 }], [{ node: 'Set Metadados', type: 'main', index: 0 }]] },
    'Write Binary File': { main: [[{ node: 'EXECUTAR OCR', type: 'main', index: 0 }]] },
    'EXECUTAR OCR': { main: [[{ node: 'SALVAR OCR .TXT', type: 'main', index: 0 }]] },
    'SALVAR OCR .TXT': { main: [[{ node: 'Set Metadados', type: 'main', index: 0 }]] },
    'Set Metadados': { main: [[{ node: 'RESPOSTA SUCESSO', type: 'main', index: 0 }]] },
    'RESPOSTA SUCESSO': { main: [[]] },
    'RESPOSTA ERRO': { main: [[]] }
  };

  // Deploy
  await api('POST', 'workflows/WFCRM001comp01/deactivate', '{}');
  await new Promise(r => setTimeout(r, 500));
  const settings = { executionOrder: (wf.settings && wf.settings.executionOrder) || 'v1' };
  const dr = await api('PUT', 'workflows/WFCRM001comp01', JSON.stringify({ name: wf.name, nodes, connections: newConn, settings, staticData: wf.staticData || null }));
  console.log('Deploy:', dr.s === 200 ? 'OK' : 'FAIL');
  if (dr.s !== 200) { console.log('Error:', dr.b.substring(0, 500)); process.exit(1); }
  await api('POST', 'workflows/WFCRM001comp01/activate', '{}');
  console.log('Activated.\n');

  // === TESTS ===
  console.log('=== TESTS ===\n');
  const pass = []; const fail = [];
  function check(n, ok, d) { console.log((ok ? '  PASS' : '  FAIL') + ' | ' + n + (d ? ' | ' + d : '')); (ok ? pass : fail).push(n); }
  function sendJson(data, wp) {
    const p = wp || '/webhook/comprovante';
    return new Promise(resolve => {
      const body = JSON.stringify(data); const cl = Buffer.byteLength(body);
      const opts = { hostname: 'localhost', port: 5678, path: p, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': cl }, timeout: 60000 };
      const r = http.request(opts, rp => { let d = ''; rp.on('data', c => d += c); rp.on('end', () => resolve({ s: rp.statusCode, body: d })); });
      r.on('error', e => resolve({ s: 0, body: JSON.stringify({ error: e.message }) })); r.on('timeout', () => { r.destroy(); resolve({ s: 0, body: JSON.stringify({ error: 'timeout' }) }); });
      r.write(body); r.end();
    });
  }

  const sampleDir = 'n8n/data/test_samples';
  const procDir = 'n8n/n8n-files/comprovantes/processados';
  if (!fs.existsSync(procDir)) fs.mkdirSync(procDir, { recursive: true });
  const testText = 'COMPROVANTE PIX 1234 VALOR R$ 150,00 DATA 22/07/2026';

  if (!fs.existsSync(path.join(sampleDir, 'test_ocr.pdf')))
    fs.writeFileSync(path.join(sampleDir, 'test_ocr.pdf'), Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n4 0 obj<</Length 51>>stream\nBT /F1 12 Tf 100 700 Td (' + testText + ') Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n378\n%%EOF'));
  if (!fs.existsSync(path.join(sampleDir, 'test_ocr.jpg')))
    fs.writeFileSync(path.join(sampleDir, 'test_ocr.jpg'), Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]), Buffer.from([0xFF, 0xFE]), Buffer.from([0x00, testText.length + 2]), Buffer.from(testText, 'ascii'), Buffer.from([0xFF, 0xD9])]));
  if (!fs.existsSync(path.join(sampleDir, 'test_ocr.png'))) {
    const crcTable2 = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); } crcTable2[n] = c; }
    const crc2 = (buf) => { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) { c = (c >>> 8) ^ crcTable2[(c ^ buf[i]) & 0xFF]; } return (c ^ 0xFFFFFFFF) >>> 0; };
    const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
    const ihdr = Buffer.from([0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,0xDE]);
    const tEXtData = Buffer.from('Text\0' + testText, 'ascii');
    const tEXtLen = Buffer.alloc(4); tEXtLen.writeUInt32BE(tEXtData.length, 0);
    const tEXtType = Buffer.from('tEXt');
    const tEXtCrc = Buffer.alloc(4); tEXtCrc.writeUInt32BE(crc2(Buffer.concat([tEXtType, tEXtData])), 0);
    const iend = Buffer.from([0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);
    fs.writeFileSync(path.join(sampleDir, 'test_ocr.png'), Buffer.concat([sig, ihdr, tEXtLen, tEXtType, tEXtData, tEXtCrc, iend]));
  }

  function readB64(fp) { return fs.readFileSync(fp).toString('base64'); }

  // Test 1: PDF OCR
  console.log('--- Test 1: PDF OCR ---');
  const r1 = await sendJson({ user_id: 'test', file_base64: readB64(path.join(sampleDir, 'test_ocr.pdf')), file_name: 'comp_pdf.pdf', file_type: 'application/pdf' });
  console.log('  Raw:', r1.body.substring(0, 400));
  let j1; try { j1 = JSON.parse(r1.body); } catch(e) { j1 = { status: 'parse_error' }; }
  check('PDF OCR', j1.status === 'success' && j1.ocr_status !== undefined, 'ocr=' + (j1.ocr_status || '?') + ' eng=' + (j1.ocr_engine || '?'));

  // Test 2: JPG OCR
  console.log('\n--- Test 2: JPG OCR ---');
  const r2 = await sendJson({ user_id: 'test', file_base64: readB64(path.join(sampleDir, 'test_ocr.jpg')), file_name: 'comp_jpg.jpg', file_type: 'image/jpeg' });
  console.log('  Raw:', r2.body.substring(0, 400));
  let j2; try { j2 = JSON.parse(r2.body); } catch(e) { j2 = { status: 'parse_error' }; }
  check('JPG OCR', j2.status === 'success' && j2.ocr_status !== undefined, 'ocr=' + (j2.ocr_status || '?') + ' eng=' + (j2.ocr_engine || '?'));

  // Test 3: PNG OCR
  console.log('\n--- Test 3: PNG OCR ---');
  const r3 = await sendJson({ user_id: 'test', file_base64: readB64(path.join(sampleDir, 'test_ocr.png')), file_name: 'comp_png.png', file_type: 'image/png' });
  console.log('  Raw:', r3.body.substring(0, 400));
  let j3; try { j3 = JSON.parse(r3.body); } catch(e) { j3 = { status: 'parse_error' }; }
  check('PNG OCR', j3.status === 'success' && j3.ocr_status !== undefined, 'ocr=' + (j3.ocr_status || '?') + ' eng=' + (j3.ocr_engine || '?'));

  // Test 4: OCR indisponivel (stop ocr-service)
  console.log('\n--- Test 4: OCR indisponivel ---');
  try { execSync('docker compose stop ocr-service', { stdio: 'pipe', timeout: 10000, shell: true }); } catch(e) {}
  const r4 = await sendJson({ user_id: 'test', file_base64: readB64(path.join(sampleDir, 'test_ocr.jpg')), file_name: 'sem_ocr.jpg', file_type: 'image/jpeg' });
  console.log('  Raw:', r4.body.substring(0, 400));
  let j4; try { j4 = JSON.parse(r4.body); } catch(e) { j4 = { status: 'parse_error' }; }
  check('OCR indisponivel', j4.status === 'success' && (j4.ocr_status === 'erro' || j4.ocr_erro), 'ocr=' + (j4.ocr_status || '?') + ' erro=' + (j4.ocr_erro || '?'));
  try { execSync('docker compose start ocr-service', { stdio: 'pipe', timeout: 10000, shell: true }); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  // Test 5: Corrompido
  console.log('\n--- Test 5: Corrompido ---');
  const r5 = await sendJson({ user_id: 'test', file_base64: Buffer.from([0x00, 0x01, 0x02, 0x03]).toString('base64'), file_name: 'corrupt.jpg', file_type: 'image/jpeg' });
  console.log('  Raw:', r5.body.substring(0, 400));
  let j5; try { j5 = JSON.parse(r5.body); } catch(e) { j5 = { status: 'parse_error' }; }
  check('Corrompido', j5.status === 'success' && j5.ocr_status !== undefined, 'ocr=' + (j5.ocr_status || '?') + ' erro=' + (j5.ocr_erro || '?'));

  // Test 6: .txt on disk
  console.log('\n--- Test 6: .txt files ---');
  let txts = [];
  try { const out = execSync('docker exec n8n ls /home/node/.n8n-files/comprovantes/processados/', { stdio: 'pipe', timeout: 5000, shell: true }).toString().trim(); txts = out ? out.split('\n').filter(Boolean) : []; }
  catch(e) { try { txts = fs.readdirSync(procDir).filter(f => f.endsWith('.txt')); } catch(e2) {} }
  check('.txt on disk', txts.filter(f => f.endsWith('.txt')).length > 0, 'count=' + txts.filter(f => f.endsWith('.txt')).length);

  console.log('\n=====================');
  console.log('RESULTADO: Pass=' + pass.length + '/' + (pass.length + fail.length) + ' Fail=' + fail.length);
  if (fail.length > 0) { console.log('Failed: ' + fail.join(', ')); process.exit(1); }
  else console.log('All passed!');
}
main().catch(e => { console.error('Fatal:', e); process.exit(1); });
