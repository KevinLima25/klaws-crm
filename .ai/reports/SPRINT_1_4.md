# SPRINT_1_4.md
## KLAWS CRM — Sprint 1.4: Testar Agente OCR

**Data:** 2026-07-22  
**Workflow:** Agente Comprovante (OCR) — ID: `WFCRM001ocr01`  
**Status:** PARCIALMENTE CONCLUÍDA

---

### 🧪 TESTES EXECUTADOS

| Teste | Entrada | Resultado | Status |
|-------|---------|-----------|--------|
| **Health check** | `GET /healthz` | 200 OK | ✅ PASS |
| **Webhook local** | `POST /webhook/agent-ocr` | 200 OK (resposta vazia) | ⚠️ PARCIAL |
| **Webhook ngrok** | `POST https://thread-urologist-catching.ngrok-free.dev/webhook/agent-ocr` | 200 OK (resposta vazia) | ⚠️ PARCIAL |
| **Execução via API** | `POST /api/v1/workflows/WFCRM001ocr01/execute` | 405 Method Not Allowed | ❌ FALHA |

---

### ⚠️ PROBLEMAS ENCONTRADOS

| # | Problema | Severidade | Detalhes |
|---|----------|------------|----------|
| 1 | **OCR.space API key inválida/ausente** | 🔴 Crítica | Erro 400: "Bad request - please check your parameters" / "Missing apikey" nos logs de execução |
| 2 | **Webhook não registrado persistentemente** | 🔴 Crítica | `webhook_entity.webhookId = NULL` — some após restart do container |
| 3 | **Resposta vazia (Transfer-Encoding: chunked sem body)** | 🟡 Alta | Webhook responde HTTP 200 mas body vazio — `respondToWebhook` não executa |
| 4 | **Execuções falhando com status "error"** | 🔴 Crítica | 10 execuções consecutivas com status `error` (IDs 81-93) |
| 5 | **OCR.space retorna erro 400** | 🔴 Crítica | "Missing apikey (add to message header)" |

---

### 📊 ANÁLISE DAS EXECUÇÕES (execution_entity)

| Execution ID | Status | Started | Stopped | Duração | jsonSizeBytes |
|--------------|--------|---------|---------|---------|---------------|
| 93 | error | 23:54:34 | 23:54:37 | ~3s | 10198 |
| 91 | error | 23:29:22 | 23:29:23 | ~1s | 10197 |
| 90 | error | 23:28:08 | 23:28:09 | ~1s | 10097 |
| 89 | error | 23:27:00 | 23:27:01 | ~1s | 10338 |
| 88 | error | 23:26:14 | 23:26:15 | ~1s | 10092 |

**Todas as 10 execuções recentes falharam com status "error".**

---

### 🔍 ERRO RAIZ (execution_data ID 93)

```
NodeApiError: Bad request - please check your parameters
  at ExecuteContext.execute (HttpRequestV3.node.ts:869:16)

Error: E572: Missing apikey (add to message header)
```

**Causa:** O header `apikey` não está sendo enviado corretamente para a API OCR.space.

---

### 🔧 CAUSA DO PROBLEMA OCR.space

O node `OCR.space` (HTTP Request v4.1) está configurado com:
```json
{
  "jsonParameters": true,
  "parameters": {
    "json": {
      "apikey": "K87899142388957",
      "base64Image": "={{ $json.file_data }}"
    }
  }
}
```

**Problema:** A API OCR.space espera o `apikey` no **header** da requisição, não no body JSON. O node HTTP Request v4.1 está enviando tudo no body.

---

### 📋 RECOMENDAÇÕES PARA CORREÇÃO

| Ação | Prioridade | Detalhes |
|------|------------|----------|
| **Mover apikey para header** | 🔴 Crítica | Configurar `options.headers.apikey` no node HTTP Request |
| **Corrigir webhook persistence** | 🔴 Crítica | Script de startup que chama `/api/v1/workflows/{id}/activate` |
| **Validar resposta do respondToWebhook** | 🟡 Alta | Verificar se body não está vazio |
| **Testar com API key válida OCR.space** | 🟡 Alta | Obter key válida e testar endpoint real |

---

### ✅ CONFORMIDADE COM ARCHITECTURE.md

| Requisito | Status |
|-----------|--------|
| Webhook `/webhook/agent-ocr` | ✅ Criado |
| OCR.space integration | ⚠️ Configurado mas com erro de auth |
| Code node (processamento) | ✅ Implementado |
| Confidence check (IF node) | ✅ Implementado |
| Resposta estruturada | ✅ Implementado |
| Não modificar workflows existentes | ✅ CRM Chat intocado |
| Não alterar Frontend/Supabase/Docker | ✅ Não alterado |

---

### 📝 PRÓXIMOS PASSOS (SPRINT 1.5+)

1. **Fix OCR.space auth** — mover apikey para header Authorization
2. **Webhook auto-registration** — script de init que ativa workflows via API
3. **Teste E2E completo** — Frontend → CRM Chat → Master Router → OCR Agent
4. **Criar Agente Conciliação** — `/webhook/agent-conciliacao`

---

**SPRINT 1.4 PARCIALMENTE CONCLUÍDA**

- ✅ Workflow OCR testado via webhook local e ngrok
- ✅ Estrutura validada (nodes, conexões, resposta)
- ❌ **OCR.space falha** — API key no body em vez de header
- ❌ **Webhook não persiste** — bug n8n 2.30.7
- ❌ **Resposta vazia** — respondToWebhook não retorna body