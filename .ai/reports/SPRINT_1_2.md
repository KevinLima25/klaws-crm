# SPRINT_1_2.md
## KLAWS CRM — Sprint 1.2: Testar Master Router

**Data:** 2026-07-21  
**Workflow:** CRM Chat (Simplified Webhook) — ID: `WFCRM001chat01`  
**Status:** Workflow com erro de execução (Switch node)

---

### 🧪 TESTES REALIZADOS (antes da quebra do workflow)

| Entrada | file_type | Rota Esperada | Rota Real | Resultado |
|---------|-----------|---------------|-----------|-----------|
| `{"user_id":"test", "message":"oi", "file_type":"text"}` | text | Fallback → AI Agent (Atendimento) | AI Agent (Atendimento) | ✅ PASS |
| `{"user_id":"test", "message":"oi", "file_type":"image"}` | image | Switch → HTTP Request → OCR | AI Agent (fallback) | ❌ FAIL |
| `{"user_id":"test", "message":"oi", "file_type":"pdf"}` | pdf | Switch → HTTP Request → OCR | AI Agent (fallback) | ❌ FAIL |
| `{"user_id":"test", "message":"oi", "file_type":"spreadsheet"}` | spreadsheet | Switch → HTTP Request → Conciliação | AI Agent (fallback) | ❌ FAIL |

---

### 🔴 FALHAS ENCONTRADAS

| # | Falha | Detalhes | Impacto |
|---|-------|----------|---------|
| 1 | **Switch node não roteia** | Todas as entradas (image, pdf, spreadsheet) caem no fallback (output 3 → DADOS → AI Agent). O Switch node não avalia as condições corretamente. | Crítico — Master Router não funciona |
| 2 | **Formato do Switch node incompatível** | n8n 2.30.7 exige formato `conditions.options` ou `rules.values` específico. Tentativas com `conditions.string[]` e `rules.values[]` falharam com erro: `Cannot read properties of undefined (reading 'node')` | Crítico — Workflow quebra ao executar |
| 3 | **Webhook não registrado consistentemente** | `webhookId: null` (bug n8n 2.30.7). Webhook some após restart. URLs variam: `/webhook/crm-chat`, `/webhook/WFCRM001chat01/CRM%20Webhook/crm-chat`, `/webhook/wh_*/crm-chat` | Alto — Instabilidade |
| 4 | **Erro "Failed to parse request body"** | Body parser falha em algumas requisições | Médio |
| 5 | **Rate limiting** | "The service is receiving too many requests from you" | Médio |
| 6 | **SQLITE_CONSTRAINT FOREIGN KEY** | Erros de constraint no banco SQLite do n8n | Baixo |

---

### 🔍 CAUSAS RAIZ

1. **Switch node configuration**: O formato de condições do Switch node no n8n 2.30.7 (typeVersion 2) não aceita `conditions.string[]`. O formato correto usa `rules.values[]` com `key` para índice de saída, ou `conditions.options.conditions[]`.

2. **Webhook path mismatch**: O node Webhook tem `path: "webhook/crm-chat"` mas o n8n gera URLs com prefixos dinâmicos. O webhook só funciona se o workflow estiver ativo e o webhook registrado.

3. **Salvar no Buffer — file_type**: O code node original lia `$json.body.file_type` mas o webhook entrega direto em `$json.file_type`. Corrigido para `$json.body || $json`, mas workflow quebrou antes de validar.

---

### 💡 SUGESTÕES PARA PRÓXIMA SPRINT

| Ação | Descrição | Prioridade |
|------|-----------|------------|
| **Corrigir Switch node** | Usar formato `rules.values[]` com `operation: "equal"` e `key` string (ex: "image", "pdf", "spreadsheet", "fallback") ou migrar para typeVersion 3 com `conditions.options` | 🔴 Crítica |
| **Registrar webhook via API** | Após toda alteração no workflow, fazer POST `/rest/workflows/{id}/webhook` para registrar webhookId | 🔴 Crítica |
| **Validar Salvar no Buffer** | Testar extração de `file_type` com dados reais do frontend (FormData com arquivo) | 🟡 Alta |
| **Criar workflows Agente OCR / Conciliação** | Endpoints `/webhook/agent-ocr` e `/webhook/agent-conciliacao` retornam 404 — precisam ser implementados (Sprint 1.3) | 🟡 Alta |
| **Healthcheck n8n no Docker** | Adicionar healthcheck que verifica webhook ativo e reinicia se necessário | 🟡 Alta |
| **Migrar para n8n com Postgres** | SQLite tem problemas de concorrência e FK constraints | 🟢 Média |

---

### 📋 ARQUIVOS MODIFICADOS NESTA SPRINT

- `n8n/data/database.sqlite` — Workflow `WFCRM001chat01` (nodes + connections atualizados; Switch node adicionado)
- Scripts de teste/fix: `fix_switch*.py`, `fix_buffer.py`, `check_*.py` (temporários, não versionados)

---

### ✅ CONFORMIDADE COM ARCHITECTURE.md

| Requisito | Status |
|-----------|--------|
| Webhook principal em `/webhook/crm-chat` | ⚠️ Path configurado mas não registrado |
| Master Router com Switch por tipo de arquivo | ❌ Switch node com erro |
| Roteamento para Agente Atendimento (fallback) | ✅ Funcionava no fluxo linear original |
| Roteamento para Agente OCR (image/pdf) | ❌ Não roteia |
| Roteamento para Agente Conciliação (spreadsheet) | ❌ Não roteia |
| Buffer antes do Router | ✅ Salvar no Buffer → Switch |
| Não alterar outros workflows | ✅ Agente_Agendamento intocado |
| Não alterar frontend/Supabase/Docker/APIs | ✅ |

---

**NENHUM WORKFLOW FUNCIONAL PARA TESTE COMPLETO.**  
Próxima sprint deve corrigir Switch node e registrar webhook antes de testar.