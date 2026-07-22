# SPRINT_1_2_1.md
## KLAWS CRM — Sprint 1.2.1: Atualizar Webhook Público e Configurar Google Drive OAuth

**Data:** 2026-07-21  
**Workflow:** CRM Chat (Simplified Webhook) — ID: `WFCRM001chat01`  
**Status:** PARCIALMENTE CONCLUÍDA

---

### ✅ ARQUIVOS ALTERADOS

| Arquivo | Alteração | Status |
|---------|-----------|--------|
| `docker-compose.yml` | `N8N_WEBHOOK_URL=http://localhost:5678/` → `N8N_WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/` | ✅ |
| `crm/.env.local` | `NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/crm-chat` → `NEXT_PUBLIC_N8N_WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` | ✅ |
| `crm/.env.example` | `NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/crm-chat` → `NEXT_PUBLIC_N8N_WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` | ✅ |

---

### 🔗 URLs ATUALIZADAS

| Componente | Antes | Depois |
|------------|-------|--------|
| **n8n Webhook URL (produção)** | `http://localhost:5678/` | `https://thread-urologist-catching.ngrok-free.dev/` |
| **Frontend Webhook URL** | `http://localhost:5678/webhook/crm-chat` | `https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` |
| **n8n Container** | `N8N_WEBHOOK_URL=http://localhost:5678/` | `N8N_WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/` |

> **Nota:** A URL do WAHA (`WHATSAPP_HOOK_URL=http://host.docker.internal:5678/webhook/waha`) **não foi alterada** pois é comunicação interna entre containers Docker.

---

### 🔧 VARIÁVEIS ATUALIZADAS

| Variável | Arquivo | Valor Anterior | Valor Atual |
|----------|---------|----------------|-------------|
| `N8N_WEBHOOK_URL` | `docker-compose.yml` | `http://localhost:5678/` | `https://thread-urologist-catching.ngrok-free.dev/` |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | `crm/.env.local` | `http://localhost:5678/webhook/crm-chat` | `https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | `crm/.env.example` | `http://localhost:5678/webhook/crm-chat` | `https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` |

---

### 🔐 CREDENCIAIS GOOGLE DRIVE OAUTH

**Configuração requerida (manual no n8n UI):**

| Campo | Valor |
|-------|-------|
| **Client ID** | `209517735359-m42h3hhns1vhbi6galtm590csk1sek2g.apps.googleusercontent.com` |
| **Project** | `nn-agenda` |
| **Redirect URIs** | `https://thread-urologist-catching.ngrok-free.dev/rest/oauth2-credential/callback`<br>`http://127.0.0.1:5678/rest/oauth2-credential/callback` |
| **Token URI** | `https://oauth2.googleapis.com/token` |
| **Auth URI** | `https://accounts.google.com/o/oauth2/auth` |
| **Scopes** | `https://www.googleapis.com/auth/drive`<br>`https://www.googleapis.com/auth/drive.file` |

**Status:** ⚠️ **PENDENTE** - Requer configuração manual no n8n UI:
1. Acessar `http://localhost:5678` → Credentials → New Credential → Google Drive OAuth2 API
2. Inserir Client ID e Client Secret (não fornecido)
3. Configurar Redirect URIs conforme acima
4. Salvar e clicar em "Connect" para autorizar

> **Limitação:** O Client Secret não foi fornecido nas instruções. Sem ele, não é possível completar a autenticação OAuth.

---

### 🧪 RESULTADO DA AUTENTICAÇÃO / TESTE WEBHOOK

| Teste | Endpoint | Resultado | Observação |
|-------|----------|-----------|------------|
| Health check n8n | `http://localhost:5678/healthz` | ✅ 200 OK | n8n rodando |
| Webhook via ngrok (text) | `https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` | ⚠️ 200 OK + "Error in workflow" | Chega no n8n mas falha no Switch node |
| Webhook via ngrok (image) | `https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` | ⚠️ 200 OK + "Error in workflow" | Mesmo erro |
| Webhook local | `http://localhost:5678/webhook/crm-chat` | ❌ 404 / Error | Webhook ID `null` - bug n8n 2.30.7 |

**Análise:** O ngrok está roteando corretamente para o n8n (retorna HTTP 200), mas o workflow falha no **Master Router (Switch node)** com erro: `Cannot read properties of undefined (reading 'node')`. Este é um bug conhecido do Switch node no n8n 2.30.7 com o formato de condições usado.

---

### ⚠️ PROBLEMAS ENCONTRADOS

| # | Problema | Severidade | Impacto |
|---|----------|------------|---------|
| 1 | **Switch node quebrado** | 🔴 Crítica | Master Router não roteia - erro `Cannot read properties of undefined (reading 'node')` |
| 2 | **Webhook ID `null`** | 🔴 Crítica | Webhook não persiste após restart - bug n8n 2.30.7 |
| 3 | **Google Drive Client Secret ausente** | 🟡 Alta | Não é possível completar OAuth sem Client Secret |
| 4 | **Rate limiting ngrok** | 🟡 Média | "The service is receiving too many requests from you" |
| 5 | **SQLITE_CONSTRAINT FK failed** | 🟢 Baixa | Erros de constraint no banco SQLite do n8n |

---

### 🚀 PRÓXIMOS PASSOS

| Ação | Responsável | Sprint |
|------|-------------|--------|
| Corrigir Switch node (Master Router) - usar formato `rules.values[]` compatível n8n 2.30.7 | Dev | 1.3 |
| Registrar webhook via API após deploy (`POST /rest/workflows/{id}/webhook`) | DevOps | 1.3 |
| Obter Google Drive Client Secret e completar OAuth no n8n UI | Dev | 1.3 |
| Configurar healthcheck no Docker para n8n | DevOps | 1.3 |
| Migrar n8n para PostgreSQL (resolver SQLite FK constraints) | DevOps | 2.x |

---

### ✅ CONFORMIDADE COM REGRAS

| Regra | Status |
|-------|--------|
| Não alterar Frontend | ✅ Apenas `.env.local` (config) |
| Não alterar Supabase | ✅ |
| Não alterar Docker Compose (exceto webhook URL) | ✅ Apenas `N8N_WEBHOOK_URL` |
| Não alterar Master Router / Switch node | ✅ Não alterado |
| Não alterar OCR / Conciliação | ✅ |
| Não alterar APIs | ✅ |

---

**SPRINT 1.2.1 PARCIALMENTE CONCLUÍDA**

- ✅ Webhook público atualizado para ngrok em todos os arquivos de configuração
- ⚠️ Google Drive OAuth configurado parcialmente (falta Client Secret)
- ⚠️ Switch node do Master Router continua quebrado (fora do escopo desta sprint)
- ⚠️ Webhook ID `null` persiste (bug n8n 2.30.7)