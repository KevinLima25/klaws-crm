const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('n8n/data/database.sqlite');

function nid() { return crypto.randomUUID().replace(/-/g, '').substring(0, 32); }
const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000';

const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001comp01'").get();
let nodes = JSON.parse(wf.nodes);
let conn = JSON.parse(wf.connections);

// ============ VALIDAR ARQUIVO ============
// This node MUST work. Let's make it super simple:
// Check if binary data is available from ANY of these paths:
// $binary, item.binary, $input.first().binary
const valNode = nodes.find(n => n.name === 'VALIDAR ARQUIVO');
valNode.parameters.jsCode = [
  "const items = $input.all(); if (!items || items.length === 0) return [{json:{status:'erro',erro:'Sem itens'}}];",
  "const item = items[0];",
  "",
  "// Try to get binary data from multiple sources",
  "let buf = null;",
  "let fileName = '';",
  "let mimeType = '';",
  "let source = 'none';",
  "",
  "// Source 1: $binary",
  "const binKeys = Object.keys($binary || {});",
  "if (binKeys.length > 0) {",
  "  const bin = $binary[binKeys[0]];",
  "  if (bin) {",
  "    if (Buffer.isBuffer(bin.data)) { buf = bin.data; source = 'dollar_binary.buffer'; }",
  "    else if (typeof bin.data === 'string') { buf = Buffer.from(bin.data, 'base64'); source = 'dollar_binary.base64'; }",
  "    fileName = bin.fileName || bin.file_name || '';",
  "    mimeType = bin.mimeType || bin.mime_type || '';",
  "  }",
  "}",
  "",
  "// Source 2: item.binary",
  "if (!buf && item.binary) {",
  "  const ibKeys = Object.keys(item.binary);",
  "  if (ibKeys.length > 0) {",
  "    const ib = item.binary[ibKeys[0]];",
  "    if (ib) {",
  "      if (ib.data) {",
  "        if (Buffer.isBuffer(ib.data)) { buf = ib.data; source = 'item_binary.buffer'; }",
  "        else if (typeof ib.data === 'string') {",
  "          try { buf = Buffer.from(ib.data, 'base64'); source = 'item_binary.base64'; } catch(e) {}",
  "        }",
  "      }",
  "      fileName = fileName || ib.fileName || ib.file_name || '';",
  "      mimeType = mimeType || ib.mimeType || ib.mime_type || '';",
  "    }",
  "  }",
  "}",
  "",
  "// Source 3: item.json fields (from form data)",
  "const body = item.json || {};",
  "fileName = fileName || body.fileName || body.file_name || body.filename || '';",
  "mimeType = mimeType || body.mimeType || body.mime_type || body.contentType || '';",
  "",
  "const ext = fileName ? fileName.toLowerCase().split('.').pop() : '';",
  "const validExts = ['pdf', 'jpg', 'jpeg', 'png'];",
  "const erros = [];",
  "if (!buf && !fileName) erros.push('Nenhum arquivo recebido');",
  "if (fileName && !validExts.includes(ext)) erros.push('Extensao invalida: ' + ext);",
  "",
  "return [{json: {",
  "  valido: erros.length === 0,",
  "  erros: erros,",
  "  arquivo_nome: fileName,",
  "  arquivo_tipo: mimeType,",
  "  arquivo_binario: buf ? 'presente:' + buf.length + 'bytes' : 'ausente',",
  "  fonte_binario: source",
  "}, binary: item.binary}];"
].join('\n');

// ============ GERAR HASH SHA256 ============
const hashNode = nodes.find(n => n.name === 'GERAR HASH SHA256');
hashNode.parameters.jsCode = [
  "const items = $input.all(); if (!items || items.length === 0) return [];",
  "const item = items[0]; const json = item.json;",
  "let hash_sha256 = ''; let fileSize = 0; let buf = null;",
  "",
  "// Try to get binary data (same strategy as VALIDAR)",
  "const binKeys = Object.keys($binary || {});",
  "if (binKeys.length > 0) {",
  "  const bin = $binary[binKeys[0]];",
  "  if (bin) {",
  "    if (Buffer.isBuffer(bin.data)) buf = bin.data;",
  "    else if (typeof bin.data === 'string') buf = Buffer.from(bin.data, 'base64');",
  "  }",
  "}",
  "if (!buf && item.binary) {",
  "  const ibKeys = Object.keys(item.binary);",
  "  if (ibKeys.length > 0) {",
  "    const ib = item.binary[ibKeys[0]];",
  "    if (ib && ib.data) {",
  "      if (Buffer.isBuffer(ib.data)) buf = ib.data;",
  "      else if (typeof ib.data === 'string') buf = Buffer.from(ib.data, 'base64');",
  "    }",
  "  }",
  "}",
  "",
  "if (buf) {",
  "  hash_sha256 = require('crypto').createHash('sha256').update(buf).digest('hex');",
  "  fileSize = buf.length;",
  "}",
  "",
  "return [{json: Object.assign({}, json, { hash_sha256, fileSize }), binary: item.binary}];"
].join('\n');

// ============ GERAR ID COMPROVANTE ============
const idNode = nodes.find(n => n.name === 'GERAR ID COMPROVANTE');
idNode.parameters.jsCode = [
  "const items = $input.all(); const item = items[0];",
  "const id = 'COMP-' + new Date().toISOString().replace(/[^0-9]/g,'').substring(0,14) + '-' + Math.random().toString(36).substring(2,6).toUpperCase();",
  "return [{json: Object.assign({}, item.json, { comprovante_id: id }), binary: item.binary}];"
].join('\n');

// ============ VERIFICAR DUPLICIDADE ============
const dupNode = nodes.find(n => n.name === 'VERIFICAR DUPLICIDADE');
dupNode.parameters.jsCode = [
  "const items = $input.all(); const item = items[0]; const json = item.json;",
  "let duplicado = false; let metadata_existente = null;",
  "const hash = json.hash_sha256;",
  "if (hash) {",
  "  try {",
  "    const fs = require('fs');",
  "    const metaDir = '/home/node/.n8n/comprovantes/metadata';",
  "    if (fs.existsSync(metaDir)) {",
  "      const files = fs.readdirSync(metaDir).filter(f => f.endsWith('.json'));",
  "      for (const f of files) {",
  "        const meta = JSON.parse(fs.readFileSync(metaDir + '/' + f, 'utf8'));",
  "        if (meta.hash_sha256 === hash) { duplicado = true; metadata_existente = meta; break; }",
  "      }",
  "    }",
  "  } catch(e) { console.error('Dedup error:', e.message); }",
  "}",
  "return [{json: Object.assign({}, json, { duplicado, metadata_existente }), binary: item.binary}];"
].join('\n');

// ============ MOVER PARA PROCESSANDO ============
const movProc = nodes.find(n => n.name === 'MOVER PARA PROCESSANDO');
movProc.parameters.jsCode = [
  "const items = $input.all(); const item = items[0]; const json = item.json;",
  "let saved = false; let filePath = '';",
  "let buf = null;",
  "const binKeys = Object.keys($binary || {});",
  "if (binKeys.length > 0) { const bin = $binary[binKeys[0]]; if (bin) { if (Buffer.isBuffer(bin.data)) buf = bin.data; else if (typeof bin.data === 'string') buf = Buffer.from(bin.data, 'base64'); } }",
  "if (!buf && item.binary) { const ibKeys = Object.keys(item.binary); if (ibKeys.length > 0) { const ib = item.binary[ibKeys[0]]; if (ib && ib.data) { if (Buffer.isBuffer(ib.data)) buf = ib.data; else if (typeof ib.data === 'string') buf = Buffer.from(ib.data, 'base64'); } } }",
  "if (buf) { try { const fs=require('fs'); const dir='/home/node/.n8n/comprovantes/processando'; if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true}); filePath=dir+'/'+(json.comprovante_id||'proc')+'_'+(json.arquivo_nome||'arquivo'); fs.writeFileSync(filePath,buf); saved=true; } catch(e){console.error(e.message);} }",
  "return [{json: Object.assign({}, json, { arquivo_processando: saved }), binary: item.binary}];"
].join('\n');

// ============ GERAR METADATA ============
const metaNode = nodes.find(n => n.name === 'GERAR METADATA');
metaNode.parameters.jsCode = [
  "const items = $input.all(); const item = items[0]; const json = item.json;",
  "const metadata = {",
  "  comprovante_id: json.comprovante_id || '',",
  "  hash_sha256: json.hash_sha256 || '',",
  "  arquivo_original: json.arquivo_nome || '',",
  "  mime_type: json.arquivo_tipo || '',",
  "  tamanho_bytes: json.fileSize || 0,",
  "  origem: 'crm_chat',",
  "  status: 'processado',",
  "  ocr_status: 'pendente',",
  "  conciliacao_status: 'pendente',",
  "  created_at: new Date().toISOString()",
  "};",
  "return [{json: Object.assign({}, json, { metadata }), binary: item.binary}];"
].join('\n');

// ============ SALVAR METADATA ============
const salvarNode = nodes.find(n => n.name === 'SALVAR METADATA');
salvarNode.parameters.jsCode = [
  "const items = $input.all(); const item = items[0]; const json = item.json;",
  "let saved = false; let metaPath = '';",
  "if (json.metadata) {",
  "  try { const fs=require('fs'); const dir='/home/node/.n8n/comprovantes/metadata'; if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true}); metaPath=dir+'/'+(json.metadata.comprovante_id||'meta')+'.json'; fs.writeFileSync(metaPath, JSON.stringify(json.metadata, null, 2)); saved=true; } catch(e){console.error(e.message);}",
  "}",
  "return [{json: Object.assign({}, json, { metadata_salvo: saved, caminho_metadata: metaPath }), binary: item.binary}];"
].join('\n');

// ============ MOVER PARA PROCESSADOS ============
const movProc2 = nodes.find(n => n.name === 'MOVER PARA PROCESSADOS');
movProc2.parameters.jsCode = [
  "const items = $input.all(); const item = items[0]; const json = item.json;",
  "let moved = false; let finalPath = ''; let buf = null;",
  "const binKeys = Object.keys($binary || {});",
  "if (binKeys.length > 0) { const bin = $binary[binKeys[0]]; if (bin) { if (Buffer.isBuffer(bin.data)) buf = bin.data; else if (typeof bin.data === 'string') buf = Buffer.from(bin.data, 'base64'); } }",
  "if (!buf && item.binary) { const ibKeys = Object.keys(item.binary); if (ibKeys.length > 0) { const ib = item.binary[ibKeys[0]]; if (ib && ib.data) { if (Buffer.isBuffer(ib.data)) buf = ib.data; else if (typeof ib.data === 'string') buf = Buffer.from(ib.data, 'base64'); } } }",
  "if (buf) { try { const fs=require('fs'); const dir='/home/node/.n8n/comprovantes/processados'; if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true}); finalPath=dir+'/'+(json.comprovante_id||'proc')+'_'+(json.arquivo_nome||'arquivo'); fs.writeFileSync(finalPath,buf); moved=true; } catch(e){console.error(e.message);} }",
  "return [{json: Object.assign({}, json, { movido_para_processados: moved, caminho_final: finalPath }), binary: item.binary}];"
].join('\n');

// ============ MOVER PARA DUPLICADOS ============
const movDup = nodes.find(n => n.name === 'MOVER PARA DUPLICADOS');
movDup.parameters.jsCode = [
  "const items = $input.all(); const item = items[0]; const json = item.json;",
  "let saved = false; let savePath = ''; let buf = null;",
  "const binKeys = Object.keys($binary || {});",
  "if (binKeys.length > 0) { const bin = $binary[binKeys[0]]; if (bin) { if (Buffer.isBuffer(bin.data)) buf = bin.data; else if (typeof bin.data === 'string') buf = Buffer.from(bin.data, 'base64'); } }",
  "if (!buf && item.binary) { const ibKeys = Object.keys(item.binary); if (ibKeys.length > 0) { const ib = item.binary[ibKeys[0]]; if (ib && ib.data) { if (Buffer.isBuffer(ib.data)) buf = ib.data; else if (typeof ib.data === 'string') buf = Buffer.from(ib.data, 'base64'); } } }",
  "if (buf) { try { const fs=require('fs'); const dir='/home/node/.n8n/comprovantes/duplicados'; if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true}); savePath=dir+'/'+(json.comprovante_id||'dup')+'_'+(json.arquivo_nome||'arquivo'); fs.writeFileSync(savePath,buf); saved=true; } catch(e){console.error(e.message);} }",
  "return [{json: Object.assign({}, json, { arquivo_duplicado: saved }), binary: item.binary}];"
].join('\n');

// ============ DEPLOY ============
const vid = crypto.randomUUID();
db.exec('BEGIN TRANSACTION');
try {
  // Clear trigger status
  db.prepare("DELETE FROM workflow_publication_trigger_status WHERE workflowId='WFCRM001comp01'").run();
  // Update workflow entity
  db.prepare("UPDATE workflow_entity SET nodes=?,connections=?,active=1,updatedAt=?,versionId=?,versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?")
    .run(JSON.stringify(nodes), JSON.stringify(conn), now, vid, 'WFCRM001comp01');
  // Add history entry
  db.prepare("INSERT INTO workflow_history (versionId,workflowId,authors,nodes,connections,name,createdAt,updatedAt,autosaved) VALUES(?,?,?,?,?,?,?,?,1)")
    .run(vid, 'WFCRM001comp01', 'api', JSON.stringify(nodes), JSON.stringify(conn), wf.name, now, now);
  db.exec('COMMIT');
  console.log('Deployed version ' + vid);
} catch (e) { db.exec('ROLLBACK'); console.error('Deploy failed:', e.message); }
db.close();
