const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');

const db = new DatabaseSync('n8n/data/database.sqlite');

const WF_ID = 'WFCRM001chat01';

// Read current workflow
const wf = db.prepare("SELECT * FROM workflow_entity WHERE id=?").get(WF_ID);
let nodes = JSON.parse(typeof wf.nodes === 'string' ? wf.nodes : JSON.stringify(wf.nodes));

// =====================================================
// 1. Add Classifier Code node
// =====================================================
const classifierId = 'classifier_' + Date.now();
nodes.push({
  parameters: {
    jsCode: [
      "const binaryKeys = Object.keys($binary || {});",
      "let route = 'text';",
      "let fileType = '';",
      "",
      "if (binaryKeys.length > 0) {",
      "  const firstFile = $binary[binaryKeys[0]];",
      "  const mimeType = (firstFile && firstFile.mimeType || '').toLowerCase();",
      "  fileType = mimeType;",
      "  if (mimeType.startsWith('image/')) route = 'image';",
      "  else if (mimeType === 'application/pdf') route = 'pdf';",
      "  else if (mimeType.startsWith('audio/')) route = 'audio';",
      "  else if (mimeType.startsWith('video/')) route = 'video';",
      "  else route = 'other';",
      "}",
      "",
      "const output = Object.assign({}, $json);",
      "output.route = route;",
      "output.file_type = fileType;",
      "output.has_files = binaryKeys.length > 0;",
      "",
      "return [{ json: output, binary: $binary }];"
    ].join('\n')
  },
  id: classifierId,
  name: "Classifier",
  type: "n8n-nodes-base.code",
  typeVersion: 1,
  position: [480, 500]
});

// =====================================================
// 2. Add placeholder Set nodes
// =====================================================
const ts = Date.now();

const ocrImgId = 'ocr_img_' + ts;
nodes.push({
  id: ocrImgId,
  name: 'OCR_PENDING (Imagem)',
  type: 'n8n-nodes-base.set',
  typeVersion: 3.4,
  position: [1000, -60],
  parameters: {
    assignments: {
      assignments: [
        { id: crypto.randomUUID(), name: 'text', value: 'Recebi sua imagem. O processamento de OCR ser\u00e1 implementado em breve.', type: 'string' }
      ]
    },
    options: {}
  }
});

const ocrPdfId = 'ocr_pdf_' + ts;
nodes.push({
  id: ocrPdfId,
  name: 'OCR_PENDING (PDF)',
  type: 'n8n-nodes-base.set',
  typeVersion: 3.4,
  position: [1000, 60],
  parameters: {
    assignments: {
      assignments: [
        { id: crypto.randomUUID(), name: 'text', value: 'Recebi seu PDF. O processamento de OCR ser\u00e1 implementado em breve.', type: 'string' }
      ]
    },
    options: {}
  }
});

const audioId = 'audio_' + ts;
nodes.push({
  id: audioId,
  name: 'AUDIO_PENDING',
  type: 'n8n-nodes-base.set',
  typeVersion: 3.4,
  position: [1000, 180],
  parameters: {
    assignments: {
      assignments: [
        { id: crypto.randomUUID(), name: 'text', value: 'Recebi seu \u00e1udio. O processamento ser\u00e1 implementado em breve.', type: 'string' }
      ]
    },
    options: {}
  }
});

const videoId = 'video_' + ts;
nodes.push({
  id: videoId,
  name: 'VIDEO_PENDING',
  type: 'n8n-nodes-base.set',
  typeVersion: 3.4,
  position: [1000, 300],
  parameters: {
    assignments: {
      assignments: [
        { id: crypto.randomUUID(), name: 'text', value: 'Recebi seu v\u00eddeo. O processamento ser\u00e1 implementado em breve.', type: 'string' }
      ]
    },
    options: {}
  }
});

// =====================================================
// 3. Update Switch node parameters
// =====================================================
const switchNode = nodes.find(n => n.type === 'n8n-nodes-base.switch');
switchNode.parameters = {
  rules: {
    values: [
      { value1: '={{ $json.route }}', operation: 'equal', value2: 'image' },
      { value1: '={{ $json.route }}', operation: 'equal', value2: 'pdf' },
      { value1: '={{ $json.route }}', operation: 'equal', value2: 'audio' },
      { value1: '={{ $json.route }}', operation: 'equal', value2: 'video' }
    ]
  }
};

// =====================================================
// 4. Update connections
// =====================================================
const newConn = {
  "CRM Webhook v2": {
    main: [[{ node: "Salvar no Buffer", type: "main", index: 0 }]]
  },
  "Salvar no Buffer": {
    main: [[{ node: "Classifier", type: "main", index: 0 }]]
  },
  "Classifier": {
    main: [[{ node: "Master Router (Switch)", type: "main", index: 0 }]]
  },
  "Master Router (Switch)": {
    main: [
      [{ node: "OCR_PENDING (Imagem)", type: "main", index: 0 }],
      [{ node: "OCR_PENDING (PDF)", type: "main", index: 0 }],
      [{ node: "AUDIO_PENDING", type: "main", index: 0 }],
      [{ node: "VIDEO_PENDING", type: "main", index: 0 }],
      [{ node: "DADOS", type: "main", index: 0 }]
    ]
  },
  "DADOS": {
    main: [[{ node: "AI Agent", type: "main", index: 0 }]]
  },
  "AI Agent": {
    main: [[{ node: "Format Response", type: "main", index: 0 }]]
  },
  "Simple Memory": {
    ai_memory: [[{ node: "AI Agent", type: "ai_memory", index: 0 }]]
  },
  "Google Gemini Chat Model": {
    ai_languageModel: [[{ node: "AI Agent", type: "ai_languageModel", index: 0 }]]
  },
  "VERIFICAR AGENDA": {
    ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
  },
  "Criar Evento": {
    ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
  },
  "Delete an event in Google Calendar": {
    ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
  }
};

// Note: HTTP Request - Agente OCR and HTTP Request - Agente Conciliação
// nodes are preserved but disconnected. They remain as candidates
// for future connection when OCR and Conciliação agents are implemented.

// =====================================================
// 5. Update workflow in database
// =====================================================
const now = new Date().toISOString().replace('T', ' ').split('.')[0];
const newVersionId = crypto.randomUUID();

db.exec('BEGIN TRANSACTION');
try {
  db.prepare(
    "INSERT INTO workflow_history (versionId, workflowId, authors, nodes, connections, name, createdAt, updatedAt, autosaved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)"
  ).run(newVersionId, WF_ID, 'api', JSON.stringify(nodes), JSON.stringify(newConn), 'CRM Chat (Simplified Webhook)', now, now);

  db.prepare(
    "UPDATE workflow_entity SET nodes=?, connections=?, versionId=?, activeVersionId=?, updatedAt=?, versionCounter=COALESCE(versionCounter,0)+1 WHERE id=?"
  ).run(JSON.stringify(nodes), JSON.stringify(newConn), newVersionId, newVersionId, now, WF_ID);

  db.exec('COMMIT');
  console.log('=== MASTER ROUTER DEPLOYED SUCCESSFULLY ===');
  console.log('Version ID:', newVersionId);
  console.log('Timestamp:', now);
  console.log('Workflow:', WF_ID);
  console.log('');
  console.log('Changes made:');
  console.log('  1. Added "Classifier" Code node (routes by MIME type from $binary)');
  console.log('  2. Updated "Master Router (Switch)" to route on $json.route');
  console.log('  3. Added 4 placeholder Set nodes for non-text routes');
  console.log('  4. Disconnected old HTTP Request nodes (preserved)');
  console.log('');
  console.log('New flow:');
  console.log('  Webhook -> Buffer -> Classifier -> Switch');
  console.log('    [0] image  -> OCR_PENDING (Imagem)');
  console.log('    [1] pdf    -> OCR_PENDING (PDF)');
  console.log('    [2] audio  -> AUDIO_PENDING');
  console.log('    [3] video  -> VIDEO_PENDING');
  console.log('    [4] text   -> DADOS -> AI Agent -> Format Response');
  console.log('');
  console.log('Run: docker restart n8n');
} catch (e) {
  db.exec('ROLLBACK');
  console.error('Error:', e.message);
  process.exit(1);
}

db.close();
