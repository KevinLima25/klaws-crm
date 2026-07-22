const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const db = new DatabaseSync('n8n/data/database.sqlite');

// ============================================================
// PART 1: Modify CRM Chat workflow (WFCRM001chat01)
// ============================================================
const wf = db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
let nodes = JSON.parse(wf.nodes);
let conn = JSON.parse(wf.connections);

// Helper to generate node IDs
function nid() { return crypto.randomUUID().replace(/-/g, '').substring(0, 32); }

// Current IF nodes to shift positions right
['Router: Imagem?', 'Router: PDF?', 'Router: Audio?', 'Router: Video?'].forEach(name => {
  const n = nodes.find(x => x.name === name);
  if (n) n.position = [n.position[0] + 220, n.position[1]];
});

// Create "Detectar Comprovante" Code node
const detectId = nid();
const detectNode = {
  id: detectId,
  name: 'Detectar Comprovante',
  typeVersion: 1,
  type: 'n8n-nodes-base.code',
  position: [424, 304],
  parameters: {
    jsCode: [
      "const items = $input.all();",
      "if (!items || items.length === 0) return [];",
      "",
      "const item = items[0];",
      "const body = item.json.body || item.json || {};",
      "const file_name = (body._file_name || body.file_name || '').toLowerCase();",
      "const file_type = (body._file_type || body.file_type || '').toLowerCase();",
      "const ext = file_name ? file_name.split('.').pop() : '';",
      "",
      "const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];",
      "const extensoesPermitidas = ['jpg', 'jpeg', 'png', 'pdf'];",
      "const isTipoValido = tiposPermitidos.includes(file_type);",
      "const isExtValida = extensoesPermitidas.includes(ext);",
      "",
      "const keywords = [",
      "  'comprovante', 'comprovant', 'comprov',",
      "  'boleto', 'bolet',",
      "  'pagamento', 'pagto',",
      "  'deposito', 'depósito', 'dep',",
      "  'extrato',",
      "  'recibo',",
      "  'pix',",
      "  'transferencia', 'transferência', 'transf',",
      "  'holerite',",
      "  'rendimento',",
      "  'notafiscal', 'nf',",
      "  'fatura',",
      "  'mensalidade',",
      "  'contribuicao', 'contribuição'",
      "];",
      "",
      "let eh_comprovante = false;",
      "if (isTipoValido || isExtValida) {",
      "  if (file_name) {",
      "    const nomeSemExt = file_name.replace('.' + ext, '').replace(/[^a-z0-9]/g, '');",
      "    eh_comprovante = keywords.some(function(kw) { return nomeSemExt.includes(kw); });",
      "  }",
      "}",
      "",
      "return [{",
      "  json: Object.assign({}, item.json, { eh_comprovante: eh_comprovante }),",
      "  binary: item.binary",
      "}];"
    ].join('\n')
  }
};

// Create "Router: Comprovante?" IF node
const compIFId = nid();
const compIFNode = {
  id: compIFId,
  name: 'Router: Comprovante?',
  typeVersion: 1,
  type: 'n8n-nodes-base.if',
  position: [644, 304],
  parameters: {
    conditions: {
      boolean: [
        {
          value1: '={{ $json.eh_comprovante }}',
          operation: 'equal',
          value2: true
        }
      ]
    }
  }
};

// Create "HTTP Request - Chamar Agente Comprovante" node
const httpId = nid();
const httpNode = {
  id: httpId,
  name: 'HTTP Request - Chamar Agente Comprovante',
  typeVersion: 4.1,
  type: 'n8n-nodes-base.httpRequest',
  position: [864, 204],
  parameters: {
    method: 'POST',
    url: 'http://localhost:5678/webhook/comprovante',
    authentication: 'none',
    sendBody: true,
    options: {
      response: { response: { responseFormat: 'json' } }
    },
    bodyParameters: {
      parameters: [
        { name: 'user_id', value: '={{ $json.body.user_id || $json.user_id }}' },
        { name: 'message', value: '={{ $json.body.message || $json.message }}' },
        { name: 'file_name', value: '={{ $json.body._file_name || $json.body.file_name }}' },
        { name: 'file_type', value: '={{ $json.body._file_type || $json.body.file_type }}' }
      ]
    }
  }
};

nodes.push(detectNode, compIFNode, httpNode);

// Update connections
conn['Salvar no Buffer'] = { main: [[{ node: 'Detectar Comprovante', type: 'main', index: 0 }]] };
conn['Detectar Comprovante'] = { main: [[{ node: 'Router: Comprovante?', type: 'main', index: 0 }]] };
conn['Router: Comprovante?'] = {
  main: [
    [{ node: 'HTTP Request - Chamar Agente Comprovante', type: 'main', index: 0 }],
    [{ node: 'Router: Imagem?', type: 'main', index: 0 }]
  ]
};

// ============================================================
// PART 2: Create Agente_Comprovante workflow
// ============================================================
const compWfId = 'WFCRM001comp01';
const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const compVid = crypto.randomUUID();

// Create nodes for Agente_Comprovante
const whCompId = nid();
const valId = nid();
const ifValId = nid();
const extId = nid();
const respOkId = nid();
const respErrId = nid();

const compNodes = [
  {
    id: whCompId,
    name: 'Webhook Comprovante',
    typeVersion: 2,
    type: 'n8n-nodes-base.webhook',
    position: [0, 304],
    parameters: {
      httpMethod: 'POST',
      path: 'comprovante',
      responseMode: 'lastNode',
      options: {}
    }
  },
  {
    id: valId,
    name: 'Validar Arquivo',
    typeVersion: 1,
    type: 'n8n-nodes-base.code',
    position: [224, 304],
    parameters: {
      jsCode: [
        "const items = $input.all();",
        "if (!items || items.length === 0) return [];",
        "",
        "const item = items[0];",
        "const body = item.json.body || item.json || {};",
        "const file_name = body._file_name || body.file_name || '';",
        "const file_type = body._file_type || body.file_type || '';",
        "const ext = file_name ? file_name.split('.').pop().toLowerCase() : '';",
        "",
        "const errors = [];",
        "let valido = true;",
        "",
        "if (!file_name) {",
        "  errors.push('Nenhum arquivo recebido');",
        "  valido = false;",
        "}",
        "",
        "if (file_name) {",
        "  if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {",
        "    errors.push('Extensão invalida: ' + ext);",
        "    valido = false;",
        "  }",
        "}",
        "",
        "if (file_type && !['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file_type)) {",
        "  errors.push('Tipo de arquivo nao suportado: ' + file_type);",
        "  valido = false;",
        "}",
        "",
        "return [{",
        "  json: Object.assign({}, item.json, {",
        "    valido: valido,",
        "    erros: errors,",
        "    arquivo_nome: file_name,",
        "    arquivo_tipo: file_type",
        "  }),",
        "  binary: item.binary",
        "}];"
      ].join('\n')
    }
  },
  {
    id: ifValId,
    name: 'Valido?',
    typeVersion: 1,
    type: 'n8n-nodes-base.if',
    position: [448, 304],
    parameters: {
      conditions: {
        boolean: [
          {
            value1: '={{ $json.valido }}',
            operation: 'equal',
            value2: true
          }
        ]
      }
    }
  },
  {
    id: extId,
    name: 'Extrair e Salvar',
    typeVersion: 1,
    type: 'n8n-nodes-base.code',
    position: [672, 204],
    parameters: {
      jsCode: [
        "const items = $input.all();",
        "if (!items || items.length === 0) return [];",
        "",
        "const item = items[0];",
        "const json = item.json;",
        "const now = new Date().toISOString();",
        "const id_interno = 'comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);",
        "",
        "const metadata = {",
        "  arquivo: json.arquivo_nome || '',",
        "  origem: json.user_id || json.body?.user_id || '',",
        "  mime: json.arquivo_tipo || '',",
        "  tamanho: 0,",
        "  status: 'recebido',",
        "  ocr: 'pendente',",
        "  conciliacao: 'pendente',",
        "  created_at: now",
        "};",
        "",
        "let saveMsg = null;",
        "try {",
        "  const fs = require('fs');",
        "  const path = require('path');",
        "  const dir = '/home/node/.n8n/comprovantes/entrada';",
        "  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }",
        "  const binaryKeys = Object.keys($binary || {});",
        "  if (binaryKeys.length > 0 && json.arquivo_nome) {",
        "    const bin = $binary[binaryKeys[0]];",
        "    const buf = Buffer.from(bin.data, 'base64');",
        "    fs.writeFileSync(path.join(dir, json.arquivo_nome), buf);",
        "    metadata.tamanho = buf.length;",
        "    saveMsg = 'Arquivo salvo em: comprovantes/entrada/' + json.arquivo_nome;",
        "  }",
        "} catch (e) {",
        "  saveMsg = 'Arquivo nao salvo (estrutura apenas): ' + e.message;",
        "}",
        "",
        "return [{",
        "  json: Object.assign({}, json, {",
        "    metadata: metadata,",
        "    id_interno: id_interno,",
        "    saveMsg: saveMsg",
        "  })",
        "}];"
      ].join('\n')
    }
  },
  {
    id: respOkId,
    name: 'Resposta Sucesso',
    typeVersion: 3.4,
    type: 'n8n-nodes-base.set',
    position: [896, 204],
    parameters: {
      assignments: {
        assignments: [
          { id: nid(), name: 'status', value: '={{ $json.metadata.status }}', type: 'string' },
          { id: nid(), name: 'arquivo_recebido', value: '={{ $json.metadata.arquivo }}', type: 'string' },
          { id: nid(), name: 'id_interno', value: '={{ $json.id_interno }}', type: 'string' },
          { id: nid(), name: 'data', value: '={{ $json.metadata.created_at }}', type: 'string' }
        ]
      },
      options: {}
    }
  },
  {
    id: respErrId,
    name: 'Resposta Erro',
    typeVersion: 3.4,
    type: 'n8n-nodes-base.set',
    position: [672, 500],
    parameters: {
      assignments: {
        assignments: [
          { id: nid(), name: 'status', value: 'erro', type: 'string' },
          { id: nid(), name: 'erro', value: '={{ $json.erros[0] || "Erro desconhecido" }}', type: 'string' },
          { id: nid(), name: 'arquivo_recebido', value: '={{ $json.arquivo_nome }}', type: 'string' },
          { id: nid(), name: 'data', value: '={{ new Date().toISOString() }}', type: 'string' }
        ]
      },
      options: {}
    }
  }
];

const compConn = {
  'Webhook Comprovante': {
    main: [[{ node: 'Validar Arquivo', type: 'main', index: 0 }]]
  },
  'Validar Arquivo': {
    main: [[{ node: 'Valido?', type: 'main', index: 0 }]]
  },
  'Valido?': {
    main: [
      [{ node: 'Extrair e Salvar', type: 'main', index: 0 }],
      [{ node: 'Resposta Erro', type: 'main', index: 0 }]
    ]
  },
  'Extrair e Salvar': {
    main: [[{ node: 'Resposta Sucesso', type: 'main', index: 0 }]]
  }
};

const compName = 'Agente_Comprovante';

// ============================================================
// PART 3: Apply to database
// ============================================================
db.exec('BEGIN TRANSACTION');
try {
  // Update CRM Chat
  const crmVid = crypto.randomUUID();
  db.prepare("INSERT INTO workflow_history (versionId,workflowId,authors,nodes,connections,name,createdAt,updatedAt,autosaved) VALUES(?,?,?,?,?,?,?,?,1)")
    .run(crmVid, 'WFCRM001chat01', 'api', JSON.stringify(nodes), JSON.stringify(conn), wf.name, now, now);
  db.prepare("UPDATE workflow_entity SET nodes=?,connections=?,versionId=?,activeVersionId=?,updatedAt=?,versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?")
    .run(JSON.stringify(nodes), JSON.stringify(conn), crmVid, crmVid, now, 'WFCRM001chat01');

  // Create Agente_Comprovante workflow
  const exists = db.prepare("SELECT id FROM workflow_entity WHERE id=?").get(compWfId);
  if (exists) {
    // Update existing
    db.prepare("UPDATE workflow_entity SET nodes=?,connections=?,name=?,active=true,updatedAt=?,versionId=?,versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?")
      .run(JSON.stringify(compNodes), JSON.stringify(compConn), compName, now, compVid, compWfId);
    db.prepare("INSERT INTO workflow_history (versionId,workflowId,authors,nodes,connections,name,createdAt,updatedAt,autosaved) VALUES(?,?,?,?,?,?,?,?,1)")
      .run(compVid, compWfId, 'api', JSON.stringify(compNodes), JSON.stringify(compConn), compName, now, now);
  } else {
    // Insert new
    db.prepare("INSERT INTO workflow_entity (id,name,nodes,connections,active,createdAt,updatedAt,versionId,versionCounter,nodeGroups) VALUES(?,?,?,?,1,?,?,?,1,'[]')")
      .run(compWfId, compName, JSON.stringify(compNodes), JSON.stringify(compConn), now, now, compVid);
    db.prepare("INSERT INTO workflow_history (versionId,workflowId,authors,nodes,connections,name,createdAt,updatedAt,autosaved) VALUES(?,?,?,?,?,?,?,?,1)")
      .run(compVid, compWfId, 'api', JSON.stringify(compNodes), JSON.stringify(compConn), compName, now, now);
    // Add shared_workflow entry so it appears in the project
    db.prepare("INSERT INTO shared_workflow (workflowId,projectId,role,createdAt,updatedAt) VALUES(?,?,?,?,?)")
      .run(compWfId, 'Pj0oqUZq7EOFtBZt', 'workflow:owner', now, now);
  }

  db.exec('COMMIT');
  console.log('Sprint 1.6 deployed successfully.');
  console.log('CRM Chat updated. Agente_Comprovante created (id: ' + compWfId + ').');
} catch (e) {
  db.exec('ROLLBACK');
  console.error('Deploy failed:', e.message);
  process.exit(1);
}
db.close();
