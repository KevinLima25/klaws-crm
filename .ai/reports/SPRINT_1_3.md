# SPRINT_1_3.md
## KLAWS CRM — Sprint 1.3: Restaurar Workflow Agente Comprovante (OCR)

**Data:** 2026-07-21  
**Workflow:** Agente Comprovante (OCR) — ID: `WFCRM001ocr01`  
**Status:** PARCIALMENTE CONCLUÍDA

---

### ✅ ARQUIVOS CRIADOS / MODIFICADOS

| Ação | Detalhe |
|------|---------|
| **Workflow criado** | `Agente Comprovante (OCR)` — ID: `WFCRM001ocr01` |
| **Webhook** | `/webhook/agent-ocr` (POST) |
| **Tabelas atualizadas** | `workflow_entity`, `workflow_history`, `workflow_published_version`, `shared_workflow` |

---

### 🔗 WORKFLOW OCR — ESTRUTURA

| Nó | Tipo | Função |
|----|------|--------|
| **Webhook OCR** | `n8n-nodes-base.webhook` | Endpoint `/webhook/agent-ocr` (responseMode: responseNode) |
| **OCR.space** | `n8n-nodes-base.httpRequest` | Chama `https://api.ocr.space/parse/image` com base64 da imagem |
| **Processar OCR** | `n8n-nodes-base.code` | Extrai texto, confiança (MeanConfidence) e campos: valor, data, hora, txid, favorecido, pagador, banco |
| **Confiança ≥ 60%** | `n8n-nodes-base.if` | Switch por confiança (MeanConfidence >= 60) |
| **Resposta Sucesso** | `n8n-nodes-base.set` | Retorna dados extraídos + status `processed` |
| **Resposta Baixa Confiança** | `n8n-nodes-base.set` | Retorna erro `low_confidence` + confiança |
| **Resposta Erro** | `n8n-nodes-base.set` | Retorna erro genérico |
| **Responder Webhook** | `n8n-nodes-base.respondToWebhook` | Retorna JSON para o Master Router |

---

### 📥 ENTRADA ESPERADA (POST /webhook/agent-ocr)

```json
{
  "user_id": "uuid-do-usuario",
  "message_id": "uuid-da-mensagem-no-buffer",
  "file_data": "base64-da-imagem-ou-pdf",
  "file_type": "image|pdf"
}
```

---

### 📤 SAÍDA ESPERADA

**Sucesso (confiança ≥ 60%):**
```json
{
  "success": true,
  "status": "processed",
  "data": {
    "valor": "100,00",
    "data": "21/07/2026",
    "hora": "14:30",
    "beneficiario": "João Silva",
    "pagador": "Maria Santos",
    "banco": "Banco do Brasil",
    "txid": "abc123..."
  },
  "confidence": 85,
  "message_id": "uuid"
}
```

**Baixa confiança (< 60%):**
```json
{
  "success": false,
  "status": "low_confidence",
  "error": "Confiança OCR baixa (< 60%)",
  "confidence": 45,
  "message_id": "uuid"
}
```

**Erro:**
```json
{
  "success": false,
  "status": "error",
  "error": "Mensagem de erro",
  "message_id": "uuid"
}
```

---

### ⚠️ PROBLEMAS ENCONTRADOS

| # | Problema | Severidade | Causa |
|---|----------|------------|-------|
| 1 | **Webhook não registrado no startup** | 🔴 Crítica | Bug n8n 2.30.7: webhooks com `webhookId` personalizado não persistem após restart. Requer toggle manual via API ou UI. |
| 2 | **SharedWorkflow não encontrado** | 🔴 Crítica | Entidade `shared_workflow` não criada automaticamente para workflows inseridos via SQL direto. |
| 3 | **Switch/IF node falha no CRM Chat** | 🟡 Alta | Master Router (Switch) no workflow `WFCRM001chat01` retorna "Error in workflow". Formato de condições incompatível com n8n 2.30.7. |
| 4 | **Ativação falha intermitente** | 🟡 Alta | Workflow OCR ativa/desativa em loop nos logs: "Activation failed: SharedWorkflow not found". |

---

### 🔧 AÇÕES DE CONTORNO APLICADAS

| Ação | Status |
|------|--------|
| Inserção direta nas tabelas `workflow_entity`, `workflow_history`, `workflow_published_version` | ✅ Feito |
| Criação manual de `shared_workflow` entry | ✅ Feito |
| Adição de `respondToWebhook` node | ✅ Feito |
| Correção de conexões para usar `respondToWebhook` | ✅ Feito |

---

### 🧪 TESTES REALIZADOS

| Teste | Endpoint | Resultado |
|-------|----------|-----------|
| Health check n8n | `GET /healthz` | ✅ 200 OK |
| OCR webhook local | `POST http://localhost:5678/webhook/agent-ocr` | ⚠️ 200 mas resposta vazia (webhook não registrado) |
| OCR webhook ngrok | `POST https://thread-urologist-catching.ngrok-free.dev/webhook/agent-ocr` | ⚠️ 200 mas resposta vazia |
| CRM Chat webhook | `POST /webhook/crm-chat` | ❌ "Error in workflow" (Switch node quebrado) |

---

### 🚀 PRÓXIMOS PASSOS (SPRINT 1.4+)

| Ação | Prioridade |
|------|------------|
| **Corrigir Master Router (Switch node)** no CRM Chat | 🔴 Crítica |
| **Registrar webhooks via API** (`POST /rest/workflows/{id}/webhook`) após cada deploy | 🔴 Crítica |
| **Script de inicialização** que faz toggle de workflows via API no startup do container | 🔴 Crítica |
| **Migrar n8n para PostgreSQL** (resolver SQLite FK constraints e concorrência) | 🟡 Alta |
| **Teste E2E**: Frontend → CRM Chat → Master Router → OCR Agent | 🟡 Alta |
| **Criar Agente Conciliação** (workflow `/webhook/agent-conciliacao`) | 🟡 Alta |

---

### ✅ CONFORMIDADE COM ARCHITECTURE.md

| Requisito | Status |
|-----------|--------|
| Webhook `/webhook/agent-ocr` | ✅ Criado |
| OCR.space integration | ✅ Implementado |
| Code node para processamento | ✅ Implementado |
| Confidence check (IF node) | ✅ Implementado |
| Resposta estruturada | ✅ Implementado |
| Não alterar Master Router | ✅ Não alterado |
| Não alterar Conciliação | ✅ Não alterado |
| Não alterar Frontend/Supabase/Docker | ✅ Não alterado |

---

**SPRINT 1.3 PARCIALMENTE CONCLUÍDA**

- ✅ Workflow Agente Comprovante (OCR) criado com estrutura completa
- ✅ Integração OCR.space + extração de campos implementada
- ✅ Threshold de confiança (60%) implementado
- ⚠️ Webhook não persiste após restart (bug n8n 2.30.7)
- ⚠️ Master Router quebrado impede teste de integração E2E