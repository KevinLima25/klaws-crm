# AUDIT_REPORT.md
## KLAWS CRM — Auditoria Completa do Projeto
**Data:** 2026-07-21
**Versão:** 1.0

---

## RESUMO EXECUTIVO

### ✅ Implementado
| Item | Status | Detalhes |
|------|--------|----------|
| **Frontend Next.js 16** | ✅ Completo | App Router, React 19, TypeScript, Shadcn UI |
| **Autenticação Supabase** | ✅ Completo | Login, callback, middleware, profiles |
| **Chat Interface v2** | ✅ Completo | 374 linhas, upload arquivos, FormData para n8n |
| **Dashboard V2** | ✅ Completo | Rankings vendas/adimplência, tabs, role-based |
| **Página Perfil** | ✅ Completo | Avatar upload, nome, cargo |
| **Admin Agentes Config** | ✅ Completo | CRUD cargos × agentes (atendimento, comprovante, conciliação) |
| **API /dashboard** | ✅ Completo | Agrega vendas + adimplência |
| **API /agentes-config** | ✅ Completo | GET/PUT com upsert |
| **API /profile, /me, /create-user, /sync-funcionarios** | ✅ Completo | |
| **n8n Workflow CRM Chat** | ✅ Ativo | ID: WFCRM001chat01, 10 nós, webhook POST /crm-chat |
| **n8n Workflow Agente_Agendamento** | ✅ Inativo | ID: UH5kg99biTCqPZ1F, Telegram + Google Calendar |
| **Supabase Migrations (3)** | ✅ Definidas | profiles, chat_messages, comprovantes, agentes_config, message_buffer, funcionarios, vendas, adimplencia |
| **Docker Compose (3 serviços)** | ✅ Completo | waha (3000), n8n (5678), crm (3001) |
| **Playwright Tests** | ✅ Configurado | login.spec.ts existe |

### ⚠️ Parcial
| Item | Status | Gaps |
|------|--------|------|
| **Master Router** | Parcial | Existe workflow linear (Webhook → Buffer → DADOS → AI Agent → Format Response). **NÃO HÁ Switch de roteamento por tipo de arquivo** |
| **Agente OCR** | Parcial | Config em `agentes_config` existe (cargo AUXILIAR COBRANCA/LIDER COBRANCA/ASSISTENTE FINANCEIRO/GERENTE = true). **Workflow NÃO EXISTE** |
| **Agente Conciliação** | Parcial | Config em `agentes_config` existe (ASSISTENTE FINANCEIRO/GERENTE = true). **Workflow NÃO EXISTE** |
| **Google Calendar OAuth** | Parcial | Nós Google Calendar existem nos workflows. **Redirect URI não registrada no Google Cloud Console** |
| **Message Buffer** | Parcial | Tabela + RLS + migration existem. Code node "Salvar no Buffer" usa `this.helpers.httpRequest()` para Supabase. **Não persiste file_data (BYTEA) corretamente** |
| **Webhook Persistence** | Parcial | Webhook ativo (webhookId=null). **Após restart do n8n, webhook some — requer toggle manual via `toggle_webhook.js`** |

### ❌ Não Implementado
| Item | Referência |
|------|------------|
| Workflow Agente OCR (`/webhook/agent-comprovante`) | TODO #3, ARCHITECTURE.md #AGENTES |
| Workflow Agente Conciliação (`/webhook/agent-conciliacao`) | TODO #4, ARCHITECTURE.md #AGENTES |
| Switch/Roteamento no Master Router | TODO #5, ARCHITECTURE.md #MASTER ROUTER |
| Auto-toggle webhook no startup container | TODO #6, RISKS.md #1 |
| Credenciais hardcoded removidas (`toggle_webhook.js`, debug scripts) | TODO #7, RISKS.md #10 |
| Testes E2E chat (Playwright) | TODO #9 |
| Refatoração chat-interface-v2.tsx (hooks) | TODO #10 |
| Limpeza scripts debug raiz (~40 .js) | TODO #8 |
| Healthcheck n8n no Docker | RISKS.md #23 |

---

## DIVERGÊNCIAS ENCONTRADAS

| Documentação | Estado Real | Classificação |
|--------------|-------------|---------------|
| `STATUS.md`: "Workflow: CRM Webhook → Salvar no Buffer → DADOS → AI Agent → Format Response" | ✅ Confere | Documentado = Real |
| `STATUS.md`: "Buffer usa `this.helpers.httpRequest()`" | ✅ Confere | Documentado = Real |
| `STATUS.md`: "Webhook não persiste após restart" | ✅ Confirmado | Documentado = Real |
| `TODO_NEXT.md`: "Agente Comprovante Workflow" | ❌ Não existe | Documentado ≠ Real |
| `TODO_NEXT.md`: "Agente Conciliação Workflow" | ❌ Não existe | Documentado ≠ Real |
| `TODO_NEXT.md`: "Reimplementar Router no Workflow Mestre" | ❌ Não implementado | Documentado ≠ Real |
| `ARCHITECTURE.md`: Master Router com Switch por tipo arquivo | ❌ Não existe | Arquitetura ≠ Real |
| `ARCHITECTURE.md`: Agentes independentes (OCR, Conciliação, Agenda) | ❌ Não existem | Arquitetura ≠ Real |
| `ARCHITECTURE.md`: Buffer obrigatório antes do Router | ✅ Parcial (existe buffer mas no workflow linear) | Arquitetura ≈ Real |
| `SESSÃO_ESTADO.md`: Google Drive OAuth configurado | ❌ Pendente | Documentado ≠ Real |

---

## RISCOS ENCONTRADOS

| Risco | Impacto | Probabilidade | Mitigação Atual |
|-------|---------|---------------|-----------------|
| Webhook some após restart n8n | Chat offline até toggle manual | 100% | `restart_n8n.bat` + `toggle_webhook.js` (workaround) |
| HTTP Request node v4.2 TypeError | Não pode usar HTTP Request node visual | Alta | Code node workaround |
| Migration 003 não aplicada no Supabase | Tabelas buffer/comprovantes/agentes_config não existem | Alta | Ação manual pendente |
| n8n API Key exposta em `toggle_webhook.js` | Acesso não autorizado à API n8n | Média | Chave no DB (user_api_keys), não em env |
| Google Calendar OAuth não configurado | Agente Agendamento falha | Alta | Redirect URI pendente no Google Cloud |
| ngrok.exe versionado (32MB) | Binário no git | Baixa | Deveria estar em .gitignore |
| Sem healthcheck n8n | Container "healthy" mas webhook inativo | Média | Falta healthcheck no docker-compose |
| Credenciais Supabase Service Key em scripts debug | Vazamento se commitado | Média | Mover para Docker Secrets |

---

## PRÓXIMA SPRINT RECOMENDADA

**SPRINT 0.2 — Infraestrutura Core (Domínio: Automações/n8n + Banco)**

1. **Aplicar Migration 003 no Supabase** (TODO #1) — Pré-requisito para buffer e agentes
2. **Registrar Google Calendar OAuth Redirect URI** (TODO #2) — Desbloqueia Agente_Agendamento
3. **Criar Workflow Agente OCR** (TODO #3) — Webhook `/webhook/agent-comprovante`, nós: Webhook → OCR.space → Parse → IF confidence → Response
4. **Criar Workflow Agente Conciliação** (TODO #4) — Webhook `/webhook/agent-conciliacao`, nós: Webhook → Parse CSV/XLS → Buscar Comprovantes → Matcher → Response
5. **Implementar Master Router Switch** (TODO #5) — No workflow CRM Chat, entre "Salvar no Buffer" e "DADOS", adicionar Switch: Texto → AI Agent | Imagem/PDF → HTTP Request `/agent-comprovante` | Planilha → HTTP Request `/agent-conciliacao`

**Arquivos a modificar (máx 5):**
- n8n: Workflow WFCRM001chat01 (adicionar Switch + 2 HTTP Request nodes)
- n8n: Novo workflow Agente OCR (export JSON)
- n8n: Novo workflow Agente Conciliação (export JSON)
- Supabase: Executar migration 003 (manual, SQL Editor)
- Google Cloud: Registrar redirect URI (manual)

---

## ARQUIVOS LIDOS (AMOSTRA)

### Projeto Raiz
- docker-compose.yml, TODO_NEXT.md, STATUS.md, RISKS.md, ARCHITECTURE_REVIEW.md, API.md, DEPENDENCIES.md, ENVIRONMENT.md, TESTS.md, TREE.md, contrato.md

### CRM Frontend
- package.json, tsconfig.json, next.config.ts
- src/app/layout.tsx, page.tsx, globals.css
- src/app/login/page.tsx, src/app/crm/page.tsx, src/app/crm/chat/page.tsx, src/app/crm/perfil/page.tsx, src/app/admin/page.tsx, src/app/admin/agentes/page.tsx
- src/app/api/dashboard/route.ts, /api/agentes-config/route.ts, /api/profile/route.ts, /api/me/route.ts, /api/create-user/route.ts, /api/sync-funcionarios/route.ts, /api/upload-avatar/route.ts, /api/auth/callback/route.ts
- src/components/chat-interface-v2.tsx (374 linhas), dashboard-v2.tsx, crm-sidebar.tsx, auth-form.tsx
- src/lib/supabase/client.ts, server.ts, admin.ts, middleware.ts, roles.ts, utils.ts
- src/components/ui/* (button, input, card, table, avatar, badge, scroll-area, separator, label, switch)
- supabase/migrations/00001_initial.sql, 00002_add_cargo_to_profiles.sql, 00003_add_comprovantes_agentes_config.sql
- tests/login.spec.ts, playwright.config.ts

### n8n
- data/database.sqlite (consultado via node:sqlite)
- Workflows: WFCRM001chat01 (ativo), UH5kg99biTCqPZ1F (inativo)
- Webhook: POST /crm-chat (webhookId=null)

### WAHA
- sessions/webjs/waha.sqlite3, media/

---

## MCPs UTILIZADOS
- **Filesystem** (leitura de arquivos locais)
- **node:sqlite** (built-in Node.js v24 — consulta n8n/database.sqlite)
- **Nenhum MCP externo** (Supabase, n8n API, Playwright, Context7 — **não utilizados**, conforme restrição de apenas leitura local)

---

**NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.**