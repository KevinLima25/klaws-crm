# SPRINT_1_1.md
## KLAWS CRM — Sprint 1.1: Restaurar Master Router (CRM Chat v2)

**Data:** 2026-07-21  
**Workflow:** CRM Chat (Simplified Webhook) — ID: `WFCRM001chat01`  
**Status:** ATIVO

---

### ✅ NÓS RESTAURADOS / ADICIONADOS

| Nó | Tipo | Função |
|----|------|--------|
| **CRM Webhook v2** | `n8n-nodes-base.webhook` | Webhook principal em `/webhook/crm-chat` (POST, responseMode: lastNode) |
| **Master Router (Switch)** | `n8n-nodes-base.switch` v2 | Roteamento por tipo de arquivo: `image`, `pdf` → Agente OCR; `spreadsheet` → Agente Conciliação; fallback (texto) → Agente Atendimento |
| **HTTP Request - Agente OCR** | `n8n-nodes-base.httpRequest` v4.1 | Chama `/webhook/agent-ocr` com payload do buffer |
| **HTTP Request - Agente Conciliação** | `n8n-nodes-base.httpRequest` v4.1 | Chama `/webhook/agent-conciliacao` com payload do buffer |

**Total de nós no workflow:** 13 (eram 10, +4 novos, -1 renomeado)

---

### 🔗 WEBHOOKS EXISTENTES

| Workflow | Path | Método | Node | Webhook ID |
|----------|------|--------|------|------------|
| CRM Chat (Simplified Webhook) | `/webhook/crm-chat` | POST | CRM Webhook v2 | `null` (bug n8n 2.30.7 — some após restart) |
| Agente_Agendamento (inativo) | `/webhook/telegram` | POST | Telegram Trigger | — |

> **Nota:** O webhook ativo tem `webhookId: null`. Após restart do container n8n, requer re-toggle manual via API (`toggle_webhook.js`).

---

### 🔀 ROTEAMENTO (Master Router)

| Regra (Switch) | Condição | Destino |
|----------------|----------|---------|
| Rule 0 | `file_type == "image"` | HTTP Request → Agente OCR |
| Rule 1 | `file_type == "pdf"` | HTTP Request → Agente OCR |
| Rule 2 | `file_type == "spreadsheet"` | HTTP Request → Agente Conciliação |
| Fallback | (texto/sem anexo) | DADOS → AI Agent (Atendimento) |

**Fluxo completo:**
```
CRM Webhook v2
    ↓
Salvar no Buffer (Supabase message_buffer)
    ↓
Master Router (Switch) — identifica file_type no JSON do buffer
    ├─ image/pdf → HTTP Request - Agente OCR → Format Response
    ├─ spreadsheet → HTTP Request - Agente Conciliação → Format Response
    └─ fallback → DADOS → AI Agent (Gemini + Calendar Tools) → Format Response
```

---

### ⚠️ PENDÊNCIAS

| Item | Descrição | Bloqueio |
|------|-----------|----------|
| **Agente OCR Workflow** | Não existe — endpoint `/webhook/agent-ocr` retorna 404 | Sprint 1.2 (TODO #3) |
| **Agente Conciliação Workflow** | Não existe — endpoint `/webhook/agent-conciliacao` retorna 404 | Sprint 1.2 (TODO #4) |
| **Webhook Persistence** | `webhookId: null` — some após restart n8n | Requer toggle manual ou healthcheck no Docker |
| **Google Calendar OAuth** | Redirect URI não registrado no Google Cloud Console | Agente Atendimento falha ao usar Calendar Tools |
| **Migration 003 Supabase** | Tabelas `message_buffer`, `comprovantes`, `agentes_config` não aplicadas | Buffer não persiste `file_data` (BYTEA) corretamente |
| **Buffer → file_type** | Code node "Salvar no Buffer" precisa extrair mime-type do anexo e setar `file_type` | Switch depende desse campo |

---

### 📋 ARQUIVOS MODIFICADOS

- `n8n/data/database.sqlite` — Workflow `WFCRM001chat01` atualizado (nodes + connections)

---

### ✅ CONFORMIDADE COM ARCHITECTURE.md

| Requisito | Status |
|-----------|--------|
| Webhook principal em `/webhook/crm-chat` | ✅ |
| Master Router com Switch por tipo de arquivo | ✅ |
| Roteamento para Agente Atendimento (fallback) | ✅ |
| Roteamento para Agente OCR (image/pdf) | ✅ |
| Roteamento para Agente Conciliação (spreadsheet) | ✅ |
| Buffer antes do Router | ✅ (Salvar no Buffer → Switch) |
| Não alterar outros workflows | ✅ (Agente_Agendamento intocado) |
| Não alterar frontend/Supabase/Docker/APIs | ✅ |

---

**NENHUM OUTRO ARQUIVO DO PROJETO FOI MODIFICADO.**