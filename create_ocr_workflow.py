import sqlite3, json, uuid
from datetime import datetime

conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()

now = datetime.now().isoformat()
workflow_id = 'WFCRM001ocr01'
webhook_id = 'agent-ocr'

nodes = [
    {
        "parameters": {
            "httpMethod": "POST",
            "path": webhook_id,
            "responseMode": "responseNode",
            "options": {}
        },
        "id": str(uuid.uuid4()).replace('-', '')[:36],
        "name": "Webhook OCR",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 2,
        "position": [250, 300],
        "webhookId": webhook_id
    },
    {
        "parameters": {
            "url": "https://api.ocr.space/parse/image",
            "method": "POST",
            "options": {},
            "jsonParameters": True,
            "parameters": {
                "json": {
                    "apikey": "K87899142388957",
                    "language": "por",
                    "isOverlayRequired": False,
                    "filetype": "auto",
                    "detectOrientation": True,
                    "scale": True,
                    "OCREngine": 2,
                    "base64Image": "={{ $json.file_data }}"
                }
            }
        },
        "id": str(uuid.uuid4()).replace('-', '')[:36],
        "name": "OCR.space",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.1,
        "position": [500, 300]
    },
    {
        "parameters": {
            "jsCode": "const response = $json;\nif (!response || response.IsErroredOnProcessing) {\n  return [{ json: { success: false, error: 'Erro no OCR.space', message_id: $json.message_id, user_id: $json.user_id } }];\n}\n\nconst parsed = response.ParsedResults ? response.ParsedResults[0] : null;\nif (!parsed) {\n  return [{ json: { success: false, error: 'Nenhum resultado do OCR', message_id: $json.message_id, user_id: $json.user_id } }];\n}\n\nconst text = parsed.ParsedText || '';\nconst confidence = parsed.MeanConfidence || 0;\n\nlet valor = null, data = null, hora = null, beneficiario = null, pagador = null, banco = null, txid = null;\nconst lines = text.split('\\n').map(l => l.trim()).filter(l => l);\n\nfor (const line of lines) {\n  const lower = line.toLowerCase();\n  \n  if (!valor && /(valor|amount|total|pix)/i.test(line)) {\n    const match = line.match(/[\\d,.]{2,}/);\n    if (match) valor = match[0];\n  }\n  if (!data && /\\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{2,4}/.test(line)) {\n    data = line.match(/\\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{2,4}/)[0];\n  }\n  if (!hora && /\\d{2}:\\d{2}/.test(line)) {\n    hora = line.match(/\\d{2}:\\d{2}/)[0];\n  }\n  if (!txid && /[a-zA-Z0-9]{26,}/.test(line)) {\n    txid = line.match(/[a-zA-Z0-9]{26,}/)[0];\n  }\n  if (!beneficiario && /(favorecido|beneficiario|recebedor)/i.test(line)) {\n    beneficiario = line.replace(/(favorecido|beneficiario|recebedor)[:\\s]*/i, '').trim();\n  }\n  if (!pagador && /(pagador|ordenador|de)/i.test(line)) {\n    pagador = line.replace(/(pagador|ordenador|de)[:\\s]*/i, '').trim();\n  }\n  if (!banco && /(banco|bradesco|itau|santander|caixa|bb|nubank|inter)/i.test(line)) {\n    banco = line.trim();\n  }\n}\n\nreturn [{\n  json: {\n    success: true,\n    text: text,\n    confidence: Math.round(confidence),\n    extracted: {\n      valor: valor,\n      data: data,\n      hora: hora,\n      beneficiario: beneficiario,\n      pagador: pagador,\n      banco: banco,\n      txid: txid\n    },\n    message_id: $json.message_id,\n    user_id: $json.user_id\n  }\n}];"
        },
        "id": str(uuid.uuid4()).replace('-', '')[:36],
        "name": "Processar OCR",
        "type": "n8n-nodes-base.code",
        "typeVersion": 1,
        "position": [750, 300]
    },
    {
        "parameters": {
            "conditions": {
                "number": [
                    {
                        "value1": "={{ $json.confidence }}",
                        "operation": "largerEqual",
                        "value2": 60
                    }
                ]
            }
        },
        "id": str(uuid.uuid4()).replace('-', '')[:36],
        "name": "Confianca >= 60%",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [1000, 300]
    },
    {
        "parameters": {
            "options": {},
            "attributes": {
                "json": {
                    "success": True,
                    "status": "processed",
                    "data": "={{ $json.extracted }}",
                    "confidence": "={{ $json.confidence }}",
                    "message_id": "={{ $json.message_id }}"
                }
            }
        },
        "id": str(uuid.uuid4()).replace('-', '')[:36],
        "name": "Resposta Sucesso",
        "type": "n8n-nodes-base.set",
        "typeVersion": 3.4,
        "position": [1250, 200]
    },
    {
        "parameters": {
            "options": {},
            "attributes": {
                "json": {
                    "success": False,
                    "status": "low_confidence",
                    "error": "Confianca OCR baixa (< 60%)",
                    "confidence": "={{ $json.confidence }}",
                    "message_id": "={{ $json.message_id }}"
                }
            }
        },
        "id": str(uuid.uuid4()).replace('-', '')[:36],
        "name": "Resposta Baixa Confianca",
        "type": "n8n-nodes-base.set",
        "typeVersion": 3.4,
        "position": [1250, 400]
    },
    {
        "parameters": {
            "options": {},
            "attributes": {
                "json": {
                    "success": False,
                    "status": "error",
                    "error": "={{ $json.error }}",
                    "message_id": "={{ $json.message_id }}"
                }
            }
        },
        "id": str(uuid.uuid4()).replace('-', '')[:36],
        "name": "Resposta Erro",
        "type": "n8n-nodes-base.set",
        "typeVersion": 3.4,
        "position": [1250, 500]
    }
]

connections = {
    "Webhook OCR": {
        "main": [[{ "node": "OCR.space", "type": "main", "index": 0 }]]
    },
    "OCR.space": {
        "main": [[{ "node": "Processar OCR", "type": "main", "index": 0 }]]
    },
    "Processar OCR": {
        "main": [[{ "node": "Confianca >= 60%", "type": "main", "index": 0 }]]
    },
    "Confianca >= 60%": {
        "main": [
            [{ "node": "Resposta Sucesso", "type": "main", "index": 0 }],
            [{ "node": "Resposta Baixa Confianca", "type": "main", "index": 0 }]
        ]
    }
}

meta = {
    "templateCredsSetupCompleted": True
}

version_id = str(uuid.uuid4()).replace('-', '')[:36]

nodes_json = json.dumps(nodes)
connections_json = json.dumps(connections)
meta_json = json.dumps(meta)

cursor.execute('''
    INSERT INTO workflow_entity 
    (id, name, active, nodes, connections, settings, meta, versionId, createdAt, updatedAt, isArchived, versionCounter, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', (
    workflow_id,
    "Agente Comprovante (OCR)",
    1,
    nodes_json,
    connections_json,
    '{}',
    meta_json,
    version_id,
    now,
    now,
    0,
    1,
    'Agente OCR - Leitura e validacao de comprovantes via OCR.space'
))

conn.commit()
print('Workflow criado: Agente Comprovante (OCR) (ID: {})'.format(workflow_id))
print('Webhook: /webhook/{}'.format(webhook_id))

cursor.execute('SELECT name, id, active FROM workflow_entity WHERE name LIKE ?', ('%OCR%',))
row = cursor.fetchone()
print('Verificado: {}'.format(row))
conn.close()