# KLAWS CRM — PROJECT STATE

**Data:** 2026-07-22
**Versão:** 1.1
**Sprint Atual:** Sprint 1 (Master Router + OCR + Conciliação)
**Commit:** `19be13a`
**Branch:** `master`

---

## RESUMO GERAL

| Métrica | Valor |
|---|---|
| **Health Score** | 45/100 |
| **Maturidade (0-10)** | 4.5 / 10 |
| **Risco Atual** | 🔴 ALTO |
| **Domínio mais maduro** | Frontend (Next.js + Auth + UI) — 85% |
| **Domínio mais crítico** | Automações n8n (workflows incompletos, webhook instável) — 35% |
| **Blockers ativos** | Migration 003 não aplicada, Google Calendar OAuth não configurado, OCR.space API key ausente |
| **Recomendação** | CONTINUAR — com correções urgentes de segurança e estabilidade |

---

## STATUS POR DOMÍNIO

### Frontend (Next.js 16 + React 19 + Tailwind v4 + shadcn) — 🟢 85%

| Componente | Status | Obs |
|---|---|---|
| App Router + Layout | ✅ Completo | Layout com sidebar + dark theme |
| Autenticação (Supabase SSR) | ✅ Completo | Login/registro, auth callback, middleware |
| Dashboard V2 (role-based) | ✅ Completo | Rankings de vendas/adimplencia por cargo |
| Chat Interface V2 | ✅ Funcional | Monolítico (374 linhas), file upload, tabs |
| Perfil (avatar, nome, email, cargo) | ✅ Completo | Upload avatar via Storage |
| Admin (criar usuário) | ✅ Completo | POST /api/create-user |
| Admin (sync funcionarios) | ✅ Completo | POST /api/sync-funcionarios |
| Admin (agentes config) | ✅ Completo | Toggle switches por cargo x agente |
| Sidebar (role-based) | ✅ Completo | Links condicionais por cargo, badge chat |
| Testes E2E | ⚠️ Apenas login | 1 spec, 3 testes |
| Refatoração (hooks) | ❌ Pendente | `src/hooks/` vazio |
| Componentes v1 (duplicados) | ⚠️ Existem | dashboard.tsx, chat-interface.tsx não removidos |

### API Routes (Next.js) — 🟢 80%

| Rota | Método | Status | Obs |
|---|---|---|---|
| `/api/agentes-config` | GET/PUT | ✅ Funcional | Admin client, upsert |
| `/api/create-user` | POST | ✅ Funcional | Cria ou atualiza |
| `/api/dashboard` | GET | ✅ Funcional | 3 tabelas, sem paginação |
| `/api/me` | GET | ✅ Funcional | Fallback profiles + listUsers |
| `/api/profile` | PUT | ✅ Funcional | Nome + avatar_url |
| `/api/sync-funcionarios` | POST | ✅ Funcional | Loop O(n²) com listUsers |
| `/api/upload-avatar` | POST | ✅ Funcional | Storage avatars |

### Banco (Supabase) — 🟡 55%

| Item | Status | Obs |
|---|---|---|
| Migrations definidas | ✅ 3/3 | 00001, 00002, 00003 |
| Migrations aplicadas | ⚠️ 2/3 | **003 pendente — CRÍTICO** |
| profiles | ✅ Aplicada | RLS ativo |
| chat_messages | ✅ Aplicada | RLS ativo |
| funcionarios | ✅ Aplicada | ❌ Sem RLS |
| vendas | ✅ Aplicada | ❌ Sem RLS |
| adimplencia | ✅ Aplicada | ❌ Sem RLS |
| comprovantes | ❌ Migration 003 não aplicada | RLS configurado na migration |
| agentes_config | ❌ Migration 003 não aplicada | RLS configurado na migration |
| message_buffer | ❌ Migration 003 não aplicada | RLS configurado na migration |
| Storage/Buckets | ⚠️ Apenas avatars | Criado automaticamente |
| Funções/Triggers | ✅ handle_new_user | Cria profile ao registrar |
| Views SQL | ❌ Não implementado | Dashboard usa API Route direto |

### Automações (n8n) — 🟠 35%

| Workflow | Status | Obs |
|---|---|---|
| CRM Chat (WFCRM001chat01) | ✅ Ativo | 10 nós, webhook /crm-chat |
| Agente Comprovante/OCR (WFCRM001ocr01) | ❌ Falhando | HTTP 400 — OCR.space API key inválida |
| Agente_Agendamento (UH5kg99biTCqPZ1F) | ❌ Inativo | Telegram trigger, 10 nós |
| Master Router (Switch) | ❌ Não existe | Fluxo linear, sem roteamento |
| Agente Conciliação | ❌ Não existe | Workflow não criado |
| Webhook persistence | ❌ Bug | webhookId=null, some após restart |
| HTTP Request node (v4.2) | ❌ Bug | TypeError, workaround via Code node |
| Backup JSON | ❌ Não existe | Risco de perda total |
| Healthcheck | ❌ Não configurado | — |

### WAHA (WhatsApp) — 🟠 30%

| Item | Status | Obs |
|---|---|---|
| Container | ✅ Running | devlikeapro/waha |
| Sessão webjs | ✅ Conectada | SQLite session |
| Webhook no n8n (/webhook/waha) | ❌ **Não existe** | WAHA envia eventos mas n8n não recebe |
| Media directory | ✅ Montado | ./waha/media |

### Google — 🔴 10%

| Serviço | Status | Obs |
|---|---|---|
| Gemini AI | ✅ Conectado | Credencial no n8n, funcional |
| Calendar OAuth | ⚠️ Parcial | Credencial existe mas redirect URI não registrado |
| Calendar Tools | ❌ Quebrado | VERIFICAR AGENDA, Criar Evento, Delete sem auth |
| Drive OAuth | ❌ Não configurado | — |
| Drive Storage | ❌ Não configurado | — |

### OCR — 🔴 10%

| Item | Status | Obs |
|---|---|---|
| OCR.space Workflow | ❌ Falhando | HTTP 400 — API key inválida/ausente |
| OCR.space API Key | ❌ Não configurada | Não encontrada no projeto |
| Playwright OCR | ❌ Não implementado | Mencionado na arquitetura |

### Conciliação — 🔴 0%

| Item | Status | Obs |
|---|---|---|
| Workflow | ❌ Não existe | Não criado |
| CTN processing | ❌ Não existe | — |
| Extrato processing | ❌ Não existe | — |

### Telegram — 🟡 20%

| Item | Status | Obs |
|---|---|---|
| Workflow | ❌ Inativo | UH5kg99biTCqPZ1F |
| Bot Token | ❌ Não verificado | — |
| Integração funcional | ❌ Não existe | — |

### DevOps/Docker — 🟡 60%

| Item | Status | Obs |
|---|---|---|
| Docker Compose | ✅ 3 serviços | waha, n8n, crm |
| Volumes persistentes | ✅ Configurados | n8n data, waha sessions, crm code |
| Networks | ✅ bridge automation | — |
| Portas | ✅ 3000, 5678, 3001 | — |
| Healthchecks | ❌ Ausentes | Nenhum container |
| Secrets management | ❌ Hardcoded | N8N_ENCRYPTION_KEY, WAHA_API_KEY no compose |
| ngrok URL | ⚠️ Hardcoded | Tunnel público instável |
| CI/CD | ❌ Não existe | — |

### Testes — 🔴 10%

| Tipo | Status | Cobertura |
|---|---|---|
| Playwright E2E | ⚠️ Mínimo | 3 testes (login apenas) |
| API Routes | ❌ Nenhum | 0% |
| n8n Workflows | ⚠️ Manual | Apenas fluxo chat texto |
| Supabase RLS | ❌ Nenhum | 0% |
| Unitários | ❌ Nenhum | 0% |

### Segurança — 🟡 40%

| Item | Status | Obs |
|---|---|---|
| N8N_ENCRYPTION_KEY | ❌ Versionada | 🔴 Crítico — no docker-compose.yml |
| Service Role Key | ⚠️ Exposta | Em .env.local + usada em APIs |
| WAHA_API_KEY | ❌ Versionada | No docker-compose.yml |
| RLS (funcionarios, vendas, adimp.) | ❌ Ausente | 🔴 Dados expostos |
| RLS (comprovantes, etc.) | ❌ Migration pendente | 🔴 Tabelas não existem |
| n8n API Key em scripts | ❌ Hardcoded | toggle_webhook.js e outros |
| ngrok.exe versionado | ⚠️ Sim | No repositório git |
| OAuth secrets | ❌ Não configurado | Calendar, Drive |

---

## DÍVIDA TÉCNICA PRIORITÁRIA

| # | Item | Domínio | Esforço | Risco se não feito |
|---|---|---|---|---|
| 1 | Aplicar Migration 003 | Banco | 5min | **CRÍTICO** — buffer/agentes não funcionam |
| 2 | Exportar backup JSON workflows | n8n | 30min | **CRÍTICO** — perda total de automações |
| 3 | Configurar OCR.space API Key | OCR | 15min | **CRÍTICO** — OCR 100% quebrado |
| 4 | Google Calendar OAuth redirect URI | Google | 1h | **ALTO** — Agenda não funciona |
| 5 | Remover N8N_ENCRYPTION_KEY do compose | Segurança | 15min | **ALTO** — descriptografia de credenciais |
| 6 | Corrigir webhookId null | n8n | 2h | **ALTO** — chat cai após restart |
| 7 | Criar webhook WAHA no n8n | n8n | 1h | **ALTO** — WhatsApp não processa |
| 8 | Implementar Master Router Switch | n8n | 3h | **ALTO** — Arquitetura quebrada |
| 9 | Adicionar RLS em tabelas existentes | Banco | 1h | **ALTO** — dados expostos |
| 10 | Criar Agente OCR workflow | n8n | 2h | **MÉDIO** — comprovantes não processam |
| 11 | Criar Agente Conciliação workflow | n8n | 4h | **MÉDIO** — conciliação não processa |
| 12 | Auto-toggle webhook no startup | n8n | 2h | **MÉDIO** — downtime pós-restart |
| 13 | Loop O(n²) em sync-funcionarios | API | 1h | **MÉDIO** — timeout com +200 users |
| 14 | Healthcheck Docker | DevOps | 1h | **MÉDIO** — sem monitoramento |
| 15 | Remover ngrok.exe do git | Git | 1min | **BAIXO** — poluição |
| 16 | Mover scripts debug para pasta | Organização | 30min | **BAIXO** — poluição |
| 17 | Testes E2E chat/dashboard/admin | Testes | 2d | **BAIXO** — regressões silenciosas |

---

## BLOCKERS ATIVOS

| Blocker | Impacto | Para desbloquear |
|---|---|---|
| Migration 003 não aplicada | Tabelas comprovantes, agentes_config, message_buffer não existem | Executar SQL no Supabase SQL Editor |
| OCR.space API key ausente | Workflow OCR 100% falhando (HTTP 400) | Obter chave em ocr.space e configurar no n8n |
| Google Calendar OAuth redirect não registrado | Ferramentas de calendário no AI Agent quebradas | Adicionar redirect URI no Google Cloud Console |
| WAHA webhook não existe no n8n | Mensagens WhatsApp não processadas | Criar webhook /webhook/waha no n8n |
| webhookId null (CRM Chat) | Webhook some após restart do n8n | Reativar manualmente ou corrigir workflow |

---

## ARQUITETURA: ESPERADO vs REAL

| Camada | ARCHITECTURE.md (Esperado) | Realidade | Gap |
|---|---|---|---|
| **Frontend** | Apenas UI, auth, dashboard, chat, forms, admin | ✅ Conforme | — |
| **Supabase** | Fonte única da verdade, todas tabelas, RLS, views | ⚠️ Mig 003 pendente | 3 tabelas faltando |
| **n8n** | Orquestrador apenas, workflows por agente, Master Router | ❌ Linear, sem router, agentes incompletos | **MAJOR** |
| **Master Router** | Switch por tipo arquivo → roteia para agente | ❌ Não existe | **CRÍTICO** |
| **Agentes** | Independentes: Atendimento, OCR, Conciliação, Agenda | ⚠️ Atendimento no CRM Chat; OCR quebrado; Conciliação inexistente | **MAJOR** |
| **Buffer** | Obrigatório antes do Router | ✅ Existe (Code node) mas em fluxo linear | Parcial |
| **Dashboard** | Consome Supabase (views/APIs), nunca workflows | ✅ Conforme | — |
| **Google Calendar** | Fonte oficial da agenda | ⚠️ Tools no AI Agent, sem auth | Parcial |
| **Google Drive** | Apenas documentos, nunca banco | ❌ Não configurado | — |
| **OCR** | OCR.space + Playwright | ❌ Workflow existe mas falha | — |
| **Conciliação** | Extrato + CTN + divergências | ❌ Não implementado | — |

---

## FLUXOS VALIDADOS vs NÃO VALIDADOS

| Fluxo | Status | Validação |
|---|---|---|
| Login → Dashboard | ✅ OK | Testado manualmente + Playwright |
| Chat (texto) → Webhook → Buffer → AI Agent → Resposta | ✅ OK | Testado manualmente |
| File upload → Webhook → Processamento | ❌ Falha | OCR quebrado, Conciliação inexistente |
| WAHA → Webhook → n8n | ❌ Falha | Webhook não existe |
| Google Calendar → Criar evento | ❌ Falha | OAuth incompleto |
| Admin → Sync funcionarios | ✅ OK | Testado manualmente |
| Admin → Criar usuario | ✅ OK | Testado manualmente |
| Admin → Agentes config | ⚠️ Parcial | Frontend funciona, migration não aplicada |
| Perfil → Upload avatar | ✅ OK | Testado manualmente |

---

## MÉTRICAS DO PROJETO

| Métrica | Valor |
|---|---|
| Linhas de código (frontend) | ~3500 (src/) |
| Componentes React | 16 (10 ui + 6 feature) |
| API Routes | 7 |
| Páginas | 8 (/login, /crm, /crm/chat, /crm/perfil, /admin, /admin/agentes, /auth/callback, /) |
| Migrations SQL | 3 |
| Tabelas Supabase (aplicadas) | 5 |
| Tabelas Supabase (pendentes) | 3 |
| Workflows n8n ativos | 2 (1 funcional, 1 falhando) |
| Workflows n8n inativos | 1 |
| Containers Docker | 3 |
| Scripts debug (.js/.py/.bat) | 75+ |
| Testes E2E | 3 (1 spec) |
| Bugs conhecidos | 10 |
| Pendências abertas | 23 |
| Dívida técnica (itens) | 17 |

---

## NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.
