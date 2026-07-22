const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('n8n/data/database.sqlite');

function nid() { return crypto.randomUUID().replace(/-/g, '').substring(0, 32); }
const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000';

// Create base folders
try {
  const fs = require('fs');
  const base = 'n8n/data/comprovantes';
  ['', '/entrada', '/processando', '/processados', '/erro', '/duplicados', '/metadata'].forEach(d => {
    const p = base + d;
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });
} catch (e) { console.log('Note: folders will be created by n8n at runtime'); }

const nodes = [
  // 1. Webhook
  { id: nid(), name: 'Webhook Comprovante', typeVersion: 2, type: 'n8n-nodes-base.webhook',
    position: [0, 300],
    parameters: { httpMethod: 'POST', path: 'comprovante', responseMode: 'lastNode', options: {} },
    webhookId: 'wh_comp_' + Date.now() },

  // 2. VALIDAR ARQUIVO
  { id: nid(), name: 'VALIDAR ARQUIVO', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [220, 300],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const item = items[0]; const body = item.json.body || item.json || {};",
      "const file_name = body._file_name || body.file_name || '';",
      "const file_type = body._file_type || body.file_type || '';",
      "const ext = file_name ? file_name.split('.').pop().toLowerCase() : '';",
      "const binaryKeys = Object.keys($binary || {});",
      "const hasBinary = binaryKeys.length > 0;",
      "const errors = []; let valido = true;",
      "if (!file_name && !hasBinary) { errors.push('Nenhum arquivo recebido'); valido = false; }",
      "if (file_name && !['pdf','jpg','jpeg','png'].includes(ext)) { errors.push('Extensao invalida: ' + ext); valido = false; }",
      "if (file_type && !['image/jpeg','image/png','image/jpg','application/pdf'].includes(file_type)) { errors.push('Tipo invalido: ' + file_type); valido = false; }",
      "return [{json: Object.assign({}, item.json, {valido, erros: errors, arquivo_nome: file_name, arquivo_tipo: file_type}), binary: item.binary}];"
    ].join('\n') } },

  // 3. Valido? (IF)
  { id: nid(), name: 'Valido?', typeVersion: 1, type: 'n8n-nodes-base.if',
    position: [440, 300],
    parameters: { conditions: { boolean: [{ value1: '={{ $json.valido }}', operation: 'equal', value2: true }] } } },

  // 4. GERAR HASH SHA256
  { id: nid(), name: 'GERAR HASH SHA256', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [660, 300],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const item = items[0];",
      "const binaryKeys = Object.keys($binary || {});",
      "let hash_sha256 = '';",
      "if (binaryKeys.length > 0) {",
      "  const bin = $binary[binaryKeys[0]];",
      "  const buf = Buffer.from(bin.data, 'base64');",
      "  hash_sha256 = require('crypto').createHash('sha256').update(buf).digest('hex');",
      "}",
      "return [{json: Object.assign({}, item.json, { hash_sha256 }), binary: item.binary}];"
    ].join('\n') } },

  // 5. GERAR ID COMPROVANTE
  { id: nid(), name: 'GERAR ID COMPROVANTE', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [860, 300],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const now = new Date();",
      "const ymd = now.toISOString().slice(0,10).replace(/-/g,'');",
      "const hms = now.toISOString().slice(11,19).replace(/:/g,'');",
      "const rand = Math.random().toString(36).substring(2,6).toUpperCase();",
      "const comprovante_id = 'COMP-' + ymd + '-' + hms + '-' + rand;",
      "return [{json: Object.assign({}, items[0].json, { comprovante_id }), binary: items[0].binary}];"
    ].join('\n') } },

  // 6. VERIFICAR DUPLICIDADE
  { id: nid(), name: 'VERIFICAR DUPLICIDADE', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [1060, 300],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const item = items[0]; const json = item.json;",
      "const hash = json.hash_sha256 || '';",
      "let duplicado = false; let comprovante_original = null;",
      "if (hash) {",
      "  try {",
      "    const fs = require('fs'); const path = require('path');",
      "    const metaDir = '/home/node/.n8n/comprovantes/metadata';",
      "    if (fs.existsSync(metaDir)) {",
      "      const files = fs.readdirSync(metaDir).filter(function(f) { return f.endsWith('.json'); });",
      "      for (let i = 0; i < files.length; i++) {",
      "        const content = JSON.parse(fs.readFileSync(path.join(metaDir, files[i]), 'utf-8'));",
      "        if (content.hash_sha256 === hash) { duplicado = true; comprovante_original = content.comprovante_id; break; }",
      "      }",
      "    }",
      "  } catch (e) { console.error('Erro ao verificar duplicidade:', e.message); }",
      "}",
      "return [{json: Object.assign({}, json, { duplicado, comprovante_original }), binary: item.binary}];"
    ].join('\n') } },

  // 7. É DUPLICADO? (IF)
  { id: nid(), name: 'É DUPLICADO?', typeVersion: 1, type: 'n8n-nodes-base.if',
    position: [1280, 300],
    parameters: { conditions: { boolean: [{ value1: '={{ $json.duplicado }}', operation: 'equal', value2: true }] } } },

  // 8. MOVER PARA DUPLICADOS
  { id: nid(), name: 'MOVER PARA DUPLICADOS', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [1500, 200],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const item = items[0]; const json = item.json;",
      "const binaryKeys = Object.keys($binary || {});",
      "let saved = false; let savePath = '';",
      "try {",
      "  const fs = require('fs'); const path = require('path');",
      "  const dir = '/home/node/.n8n/comprovantes/duplicados';",
      "  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });",
      "  if (binaryKeys.length > 0) {",
      "    const bin = $binary[binaryKeys[0]];",
      "    const buf = Buffer.from(bin.data, 'base64');",
      "    savePath = path.join(dir, (json.comprovante_id || 'dup') + '_' + (json.arquivo_nome || 'arquivo'));",
      "    fs.writeFileSync(savePath, buf); saved = true;",
      "  }",
      "} catch (e) { console.error(e.message); }",
      "return [{json: Object.assign({}, json, { arquivo_duplicado: saved, caminho_duplicado: savePath })}];"
    ].join('\n') } },

  // 9. RESPOSTA DUPLICADO
  { id: nid(), name: 'RESPOSTA DUPLICADO', typeVersion: 3.4, type: 'n8n-nodes-base.set',
    position: [1720, 200],
    parameters: { assignments: { assignments: [
      { id: nid(), name: 'status', value: 'duplicado', type: 'string' },
      { id: nid(), name: 'comprovante_id', value: '={{ $json.comprovante_id }}', type: 'string' },
      { id: nid(), name: 'message', value: 'Comprovante ja processado anteriormente', type: 'string' }
    ]}, options: {} } },

  // 10. MOVER PARA PROCESSANDO
  { id: nid(), name: 'MOVER PARA PROCESSANDO', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [1500, 400],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const item = items[0]; const json = item.json;",
      "const binaryKeys = Object.keys($binary || {});",
      "let saved = false; let filePath = '';",
      "try {",
      "  const fs = require('fs'); const path = require('path');",
      "  const dir = '/home/node/.n8n/comprovantes/processando';",
      "  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });",
      "  if (binaryKeys.length > 0) {",
      "    const bin = $binary[binaryKeys[0]];",
      "    const buf = Buffer.from(bin.data, 'base64');",
      "    filePath = path.join(dir, (json.comprovante_id || 'proc') + '_' + (json.arquivo_nome || 'arquivo'));",
      "    fs.writeFileSync(filePath, buf); saved = true;",
      "  }",
      "} catch (e) { console.error(e.message); }",
      "return [{json: Object.assign({}, json, { arquivo_processando: saved, caminho_processando: filePath }), binary: item.binary}];"
    ].join('\n') } },

  // 11. GERAR METADATA
  { id: nid(), name: 'GERAR METADATA', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [1720, 400],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const json = items[0].json;",
      "const binaryKeys = Object.keys($binary || {});",
      "let fileSize = 0;",
      "if (binaryKeys.length > 0) {",
      "  const bin = $binary[binaryKeys[0]];",
      "  fileSize = Buffer.from(bin.data, 'base64').length;",
      "}",
      "const metadata = {",
      "  comprovante_id: json.comprovante_id || '',",
      "  hash_sha256: json.hash_sha256 || '',",
      "  arquivo_original: json.arquivo_nome || '',",
      "  arquivo_processado: 'comprovantes/processados/' + (json.comprovante_id || '') + '_' + (json.arquivo_nome || 'arquivo'),",
      "  mime_type: json.arquivo_tipo || '',",
      "  tamanho_bytes: fileSize,",
      "  origem: 'crm_chat',",
      "  status: 'processado',",
      "  ocr_status: 'pendente',",
      "  conciliacao_status: 'pendente',",
      "  created_at: new Date().toISOString()",
      "};",
      "return [{json: Object.assign({}, json, { metadata }), binary: items[0].binary}];"
    ].join('\n') } },

  // 12. SALVAR METADATA
  { id: nid(), name: 'SALVAR METADATA', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [1940, 400],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const json = items[0].json; const meta = json.metadata || {};",
      "let saved = false; let metaPath = '';",
      "try {",
      "  const fs = require('fs'); const path = require('path');",
      "  const dir = '/home/node/.n8n/comprovantes/metadata';",
      "  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });",
      "  metaPath = path.join(dir, (meta.comprovante_id || 'unknown') + '.json');",
      "  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));",
      "  saved = true;",
      "} catch (e) { console.error(e.message); }",
      "return [{json: Object.assign({}, json, { metadata_salvo: saved, caminho_metadata: metaPath }), binary: items[0].binary}];"
    ].join('\n') } },

  // 13. MOVER PARA PROCESSADOS
  { id: nid(), name: 'MOVER PARA PROCESSADOS', typeVersion: 1, type: 'n8n-nodes-base.code',
    position: [2160, 400],
    parameters: { jsCode: [
      "const items = $input.all(); if (!items || items.length === 0) return [];",
      "const json = items[0].json; const meta = json.metadata || {};",
      "let moved = false; let finalPath = '';",
      "try {",
      "  const fs = require('fs'); const path = require('path');",
      "  const procDir = '/home/node/.n8n/comprovantes/processados';",
      "  if (!fs.existsSync(procDir)) fs.mkdirSync(procDir, { recursive: true });",
      "  const binaryKeys = Object.keys($binary || {});",
      "  if (binaryKeys.length > 0) {",
      "    const bin = $binary[binaryKeys[0]];",
      "    const buf = Buffer.from(bin.data, 'base64');",
      "    finalPath = path.join(procDir, (meta.comprovante_id || '') + '_' + (json.arquivo_nome || 'arquivo'));",
      "    fs.writeFileSync(finalPath, buf); moved = true;",
      "  }",
      "} catch (e) { console.error(e.message); }",
      "return [{json: Object.assign({}, json, { movido_para_processados: moved, caminho_final: finalPath })}];"
    ].join('\n') } },

  // 14. RESPOSTA SUCESSO
  { id: nid(), name: 'RESPOSTA SUCESSO', typeVersion: 3.4, type: 'n8n-nodes-base.set',
    position: [2380, 400],
    parameters: { assignments: { assignments: [
      { id: nid(), name: 'status', value: 'processado', type: 'string' },
      { id: nid(), name: 'comprovante_id', value: '={{ $json.metadata.comprovante_id }}', type: 'string' },
      { id: nid(), name: 'hash_sha256', value: '={{ $json.metadata.hash_sha256 }}', type: 'string' },
      { id: nid(), name: 'arquivo', value: '={{ $json.metadata.arquivo_original }}', type: 'string' },
      { id: nid(), name: 'ocr_status', value: '={{ $json.metadata.ocr_status }}', type: 'string' },
      { id: nid(), name: 'created_at', value: '={{ $json.metadata.created_at }}', type: 'string' }
    ]}, options: {} } },

  // 15. RESPOSTA ERRO
  { id: nid(), name: 'RESPOSTA ERRO', typeVersion: 3.4, type: 'n8n-nodes-base.set',
    position: [660, 500],
    parameters: { assignments: { assignments: [
      { id: nid(), name: 'status', value: 'erro', type: 'string' },
      { id: nid(), name: 'erro', value: '={{ $json.erros[0] || "Erro desconhecido" }}', type: 'string' },
      { id: nid(), name: 'arquivo', value: '={{ $json.arquivo_nome }}', type: 'string' },
      { id: nid(), name: 'data', value: '={{ new Date().toISOString() }}', type: 'string' }
    ]}, options: {} } }
];

const conn = {
  'Webhook Comprovante': { main: [[{ node: 'VALIDAR ARQUIVO', type: 'main', index: 0 }]] },
  'VALIDAR ARQUIVO': { main: [[{ node: 'Valido?', type: 'main', index: 0 }]] },
  'Valido?': {
    main: [
      [{ node: 'GERAR HASH SHA256', type: 'main', index: 0 }],
      [{ node: 'RESPOSTA ERRO', type: 'main', index: 0 }]
    ]
  },
  'GERAR HASH SHA256': { main: [[{ node: 'GERAR ID COMPROVANTE', type: 'main', index: 0 }]] },
  'GERAR ID COMPROVANTE': { main: [[{ node: 'VERIFICAR DUPLICIDADE', type: 'main', index: 0 }]] },
  'VERIFICAR DUPLICIDADE': { main: [[{ node: 'É DUPLICADO?', type: 'main', index: 0 }]] },
  'É DUPLICADO?': {
    main: [
      [{ node: 'MOVER PARA DUPLICADOS', type: 'main', index: 0 }],
      [{ node: 'MOVER PARA PROCESSANDO', type: 'main', index: 0 }]
    ]
  },
  'MOVER PARA DUPLICADOS': { main: [[{ node: 'RESPOSTA DUPLICADO', type: 'main', index: 0 }]] },
  'MOVER PARA PROCESSANDO': { main: [[{ node: 'GERAR METADATA', type: 'main', index: 0 }]] },
  'GERAR METADATA': { main: [[{ node: 'SALVAR METADATA', type: 'main', index: 0 }]] },
  'SALVAR METADATA': { main: [[{ node: 'MOVER PARA PROCESSADOS', type: 'main', index: 0 }]] },
  'MOVER PARA PROCESSADOS': { main: [[{ node: 'RESPOSTA SUCESSO', type: 'main', index: 0 }]] }
};

// ============================
// Apply to database
// ============================
db.exec('BEGIN TRANSACTION');
try {
  const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001comp01'").get();
  const vid = crypto.randomUUID();
  db.prepare("DELETE FROM workflow_publication_trigger_status WHERE workflowId='WFCRM001comp01'").run();
  db.prepare("UPDATE workflow_entity SET nodes=?,connections=?,name='Agente_Comprovante',active=1,updatedAt=?,versionId=?,versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?")
    .run(JSON.stringify(nodes), JSON.stringify(conn), now, vid, 'WFCRM001comp01');
  db.prepare("INSERT INTO workflow_history (versionId,workflowId,authors,nodes,connections,name,createdAt,updatedAt,autosaved) VALUES(?,?,?,?,?,?,?,?,1)")
    .run(vid, 'WFCRM001comp01', 'api', JSON.stringify(nodes), JSON.stringify(conn), wf.name, now, now);
  db.exec('COMMIT');
  console.log('Sprint 1.7 deployed. 15 nodes created.');
} catch (e) { db.exec('ROLLBACK'); console.error(e.message); process.exit(1); }
db.close();
