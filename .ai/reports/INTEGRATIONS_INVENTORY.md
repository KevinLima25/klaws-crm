# KLAWS CRM — INTEGRATIONS INVENTORY

**Data da Auditoria:** 2026-07-21

---

## INTEGRAÇÕES MAPEADAS

| Integração | Status | Onde Usada | Credencial | Observações |
|------------|--------|------------|------------|-------------|
| **Supabase** | ✅ Ativo | Frontend (auth, db, storage), n8n (Code node) | Anon Key (client), Service Role (admin/server), Service Role (n8n Code node) | Fonte única da verdade (ARCHITECTURE.md) |
| **n8n** | ✅ Ativo | Orquestração workflows, webhooks | N8N_ENCRYPTION_KEY, API Key (user_api_keys) | Container Docker, SQLite local |
| **Google Gemini** | ✅ Ativo | n8n: CRM Chat, Agente_Agendamento | Google Gemini API Key | Modelo: gemini-pro (via LangChain) |
| **Google Calendar** | ⚠️ Parcial | n8n: CRM Chat (3 tools), Agente_Agendamento (3 tools) | OAuth2 (Google Calendar) | **Redirect URI NÃO REGISTRADA** no Google Cloud Console |
| **Google Drive** | ❌ Não configurado | Planejado para OCR/Conciliação | OAuth2 (Google Drive) | Pendente — necessário para upload de comprovantes |
| **OCR.space** | ❌ Não configurado | Planejado para Agente OCR | API Key OCR.space | Workflow não existe |
| **WAHA (WhatsApp)** | ✅ Container rodando | Docker: waha (porta 3000) | WAHA_API_KEY | Webhook → n8n `/webhook/waha` (não testado) |
| **Telegram** | ⚠️ Parcial | n8n: Agente_Agendamento (inativo) | Telegram Bot Token | Apenas no workflow inativo |
| **Playwright** | ✅ Configurado | Tests: login.spec.ts | — | E2E apenas login; chat não testado |
| **Power BI** | ❌ Não integrado | Planejado (ARCHITECTURE.md) | — | Futuro |

---

## DETALHES POR INTEGRAÇÃO

### Supabase
- **Projeto:** Não identificado (apenas .env.example)
- **Tabelas ativas:** profiles, chat_messages, funcionarios, vendas, adimplencia
- **Tabelas pendentes (mig 003):** message_buffer, comprovantes, agentes_config
- **Storage:** Buckets não definidos
- **Auth:** Email/password, middleware de sessão ativo
- **RLS:** Ativo em profiles, chat_messages; mig 003 adiciona para novas tabelas

### n8n
- **Versão:** 2.30.7 (implícito pelo bug webhookId=null)
- **Banco:** SQLite (./n8n/data/database.sqlite)
- **Workflows:** 2 (1 ativo, 1 inativo)
- **Webhook ativo:** POST /crm-chat (webhookId=null — bug conhecido)
- **Credenciais armazenadas:** Criptografadas com N8N_ENCRYPTION_KEY
- **Runners:** Habilitados (N8N_RUNNERS_ENABLED=true)

### Google Gemini
- **Uso:** AI Agent nos workflows CRM Chat + Agente_Agendamento
- **Config:** @n8n/n8n-nodes-langchain.lmChatGoogleGemini v1.1
- **Ferramentas:** Nenhuma nativa (usa tools via Agent)

### Google Calendar
- **Tools no n8n:** 3 types (search, create, delete) — v1.3
- **Usado em:** CRM Chat (3 tools no AI Agent) + Agente_Agendamento (3 tools)
- **Bloqueio:** OAuth redirect URI `http://127.0.0.1:5678/rest/oauth2-credential/callback` não registrada

### WAHA
- **Container:** devlikeapro/waha na porta 3000
- **Webhook configurado:** `WHATSAPP_HOOK_URL=http://host.docker.internal:5678/webhook/waha`
- **Eventos:** `message.any`
- **Status:** Container sobe, mas webhook `/webhook/waha` não existe no n8n

### Telegram
- **Apenas no workflow inativo:** Agente_Agendamento
- **Nodes:** telegramTrigger (v1.4), telegram send (v1.2)

### OCR.space
- **Planejado para:** Agente Comprovante (OCR)
- **Fluxo:** Webhook → OCR.space API → Parse → IF confidence → Response
- **Status:** Não iniciado

### Playwright
- **Config:** playwright.config.ts existe
- **Testes:** tests/login.spec.ts (apenas login)
- **Faltando:** tests/chat.spec.ts (TODO #9)

---

## RISCOS DE INTEGRAÇÃO

| Integração | Risco | Probabilidade | Impacto |
|------------|-------|---------------|---------|
| Google Calendar | OAuth não configurado → tools falham | Alta | Agenda não funciona |
| Google Drive | Não configurado → OCR/Conciliação não podem salvar arquivos | Alta | Blockers para agentes |
| OCR.space | Sem API Key → Agente OCR impossível | Alta | Blocker |
| WAHA | Webhook /webhook/waha não existe no n8n | Média | WhatsApp não integrado |
| n8n → Supabase | Service Role Key hardcoded no Code node | Média | Vazamento credencial admin |
| Supabase Storage | Buckets não criados → upload avatar/comprovantes falha | Média | Funcionalidade quebrada |

---

**NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.**