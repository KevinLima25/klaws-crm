# RECOVERY_PLAN.md
## Plano de Recuperação e Desenvolvimento — KLAWS CRM

**Baseado em:** Auditoria completa (.ai/reports/*.md) + ARCHITECTURE.md + CONTRACT.md
**Data:** 2026-07-21
**Versão:** 1.0

---

## 1. FUNCIONALIDADES EXISTENTES (✅ Implementadas)

| Domínio | Funcionalidade | Status | Evidência |
|---------|---------------|--------|-----------|
| **Frontend** | Next.js 16 App Router + React 19 + TS + Tailwind 4 + Shadcn | ✅ Completo | package.json, src/app/ |
| **Frontend** | Autenticação Supabase (login, callback, middleware, profiles) | ✅ Completo | lib/supabase/, auth/callback/ |
| **Frontend** | Chat Interface v2 (374 linhas, upload 5 arquivos, FormData → n8n) | ✅ Completo | chat-interface-v2.tsx |
| **Frontend** | Dashboard V2 (rankings vendas/adimplência, tabs, role-based) | ✅ Completo | dashboard-v2.tsx |
| **Frontend** | Perfil (avatar upload, nome, cargo read-only) | ✅ Completo | perfil/page.tsx |
| **Frontend** | Admin: Sync funcionários, Create user | ✅ Completo | admin/page.tsx |
| **Frontend** | Admin: Config Agentes (grid cargos × agentes, switches, PUT API) | ✅ Completo | admin/agentes/page.tsx |
| **API** | GET /api/dashboard (vendas + adimplência aggregadas) | ✅ Completo | api/dashboard/route.ts |
| **API** | GET/PUT /api/agentes-config (CRUD agentes_config) | ✅ Completo | api/agentes-config/route.ts |
| **API** | CRUD profile, me, create-user, sync-funcionarios, upload-avatar | ✅ Completo | api/*/route.ts |
| **n8n** | Workflow CRM Chat (WFCRM001chat01) — ATIVO, 10 nós | ✅ Completo | database.sqlite |
| **n8n** | Workflow Agente_Agendamento (UH5kg99biTCqPZ1F) — INATIVO, 10 nós | ✅ Definido | database.sqlite |
| **n8n** | Webhook POST /crm-chat (responseMode: lastNode) | ✅ Ativo | webhook_entity |
| **Supabase** | Migrations 001, 002 aplicadas (profiles, chat_messages, funcionarios, vendas, adimplencia) | ✅ Aplicado | migrations/ |
| **Supabase** | RLS em profiles, chat_messages | ✅ Ativo | migrations/001 |
| **Supabase** | Trigger handle_new_user → profiles | ✅ Ativo | migrations/001 |
| **Docker** | 3 serviços: waha(3000), n8n(5678), crm(3001) | ✅ Completo | docker-compose.yml |
| **Testes** | Playwright configurado, login.spec.ts existe | ✅ Configurado | tests/, playwright.config.ts |

---

## 2. FUNCIONALIDADES PARCIALMENTE IMPLEMENTADAS (⚠️ Parcial)

| Funcionalidade | O que Existe | O que Falta | Prioridade |
|----------------|--------------|-------------|------------|
| **Master Router** | Workflow linear: Webhook → Buffer → DADOS → AI Agent → Format Response | **Switch por tipo arquivo** (texto/imagem/planilha), roteamento para agentes separados | 🔴 Crítica |
| **Agente OCR (Comprovante)** | Config em `agentes_config` (cargos cobrança/financeiro = true), migration 003 define tabela `comprovantes` | **Workflow inexistente** (/webhook/agent-comprovante), OCR.space integration, parse/confidence logic | 🔴 Crítica |
| **Agente Conciliação** | Config em `agentes_config` (financeiro/gerente = true), migration 003 | **Workflow inexistente** (/webhook/agent-conciliacao), CSV/XLS parse, matcher CTN+Extrato | 🔴 Crítica |
| **Agente Agenda** | Tools Google Calendar no AI Agent (CRM Chat + Agente_Agendamento) | **Workflow separado inexistente** (ARCHITECTURE.md exige agente independente), OAuth redirect URI não registrada | 🟡 Alta |
| **Message Buffer** | Tabela `message_buffer` (mig 003), Code node "Salvar no Buffer" usa httpRequest | **file_data (BYTEA) não persiste corretamente**, migração 003 não aplicada no Supabase | 🔴 Crítica |
| **Webhook Persistence** | Webhook ativo, functional | **webhookId = null** → some após restart n8n, requer toggle manual | 🔴 Crítica |
| **Google Calendar OAuth** | Nós Google Calendar nos workflows, credencial configurada no n8n | **Redirect URI não registrada no Google Cloud Console** → OAuth falha | 🟡 Alta |
| **Google Drive** | Referenciado em ARCHITECTURE.md, comprovantes têm `arquivo_drive_id` | **OAuth não configurado**, buckets Storage não criados | 🟢 Média |

---

## 3. FUNCIONALIDADES AUSENTES (❌ Não Implementadas)

| Funcionalidade | Referência | Domínio |
|----------------|------------|---------|
| Workflow Agente OCR (`/webhook/agent-comprovante`) | TODO #3, ARCHITECTURE.md #AGENTES | Automações |
| Workflow Agente Conciliação (`/webhook/agent-conciliacao`) | TODO #4, ARCHITECTURE.md #AGENTES | Automações |
| Switch/Roteamento no Master Router | TODO #5, ARCHITECTURE.md #MASTER ROUTER | Automações |
| Auto-toggle webhook no startup container | TODO #6, RISKS.md #1 | Infra/Automações |
| Credenciais hardcoded removidas (toggle_webhook.js, debug scripts) | TODO #7, RISKS.md #10 | Segurança |
| Testes E2E Chat (Playwright) | TODO #9 | Qualidade |
| Refatoração chat-interface-v2.tsx (hooks useChat, useFileUpload) | TODO #10 | Qualidade |
| Limpeza scripts debug raiz (~40 .js) | TODO #8 | Manutenção |
| Healthcheck n8n no Docker Compose | RISKS.md #23 | Infra |
| Buckets Supabase Storage (avatars, comprovantes) | Migração 003 referencia `arquivo_url` | Banco |
| Power BI Integration | ARCHITECTURE.md #INTEGRAÇÕES | BI |
| Telegram Bot (apenas no Agente_Agendamento inativo) | ARCHITECTURE.md #COMUNICAÇÃO | Comunicação |
| WAHA WhatsApp Webhook → n8n | docker-compose.yml `WHATSAPP_HOOK_URL` | Comunicação |

---

## 4. WORKFLOWS EXISTENTES

| ID | Nome | Status | Trigger | Nós | Última Modificação |
|----|------|--------|---------|-----|-------------------|
| WFCRM001chat01 | CRM Chat (Simplified Webhook) | **ATIVO** | Webhook POST /crm-chat | 10 | 2026-07-21 18:45 |
| UH5kg99biTCqPZ1F | Agente_Agendamento | **INATIVO** | Telegram Trigger | 10 | 2026-07-20 17:38 |

**Webhooks Registrados:**
- `crm-chat` (POST) → WFCRM001chat01, node "CRM Webhook", **webhookId: null**

---

## 5. WORKFLOWS FALTANTES (Conforme ARCHITECTURE.md)

| Workflow | Trigger | Nós Esperados | Responsabilidade |
|----------|---------|---------------|------------------|
| **Master Router** | Webhook POST /crm-chat | Webhook → Buffer → **Switch (tipo arquivo)** → HTTP Request para agente correto | Roteamento apenas |
| **Agente Atendimento** | HTTP Request (interno) | Recebe texto → AI Agent (Gemini) + Tools Calendar → Response | Conversa, agendamentos, dúvidas |
| **Agente OCR** | Webhook POST /agent-comprovante | Webhook → OCR.space API → Parse → IF confidence → Response | Leitura comprovantes, validação, extração |
| **Agente Conciliação** | Webhook POST /agent-conciliacao | Webhook → Parse CSV/XLS → Buscar Comprovantes → Matcher → Response | Extrato bancário, CTN, cruzamentos, divergências |
| **Agente Agenda** | HTTP Request (interno) | Google Calendar: criar/verificar/deletar eventos, confirmações | Apenas Calendar |
| **Notificações** | HTTP Request (interno) | WAHA WhatsApp, Telegram, Email | Envio de notificações |

---

## 6. BANCO DE DADOS — STATUS POR TABELA

| Tabela | Migration | Status | RLS | Índices/Keys | Observação |
|--------|-----------|--------|-----|--------------|------------|
| `profiles` | 001 | ✅ Aplicada | ✅ 3 policies | PK id (FK auth.users) | Extendida por mig 002 (cargo) |
| `chat_messages` | 001 | ✅ Aplicada | ✅ 2 policies | PK id, FK user_id | Falta índice (user_id, created_at) |
| `funcionarios` | Base + 002 | ✅ Existe | ❓ Não definido | PK id, email, cargo | Importada via CSV/admin |
| `vendas` | Base | ✅ Existe | ❓ Não definido | promotor_vendas, vendas, homologados_totais | Dashboard API |
| `adimplencia` | Base | ✅ Existe | ❓ Não definido | usuario_baixa, homologado, valor_gerado | Dashboard API |
| `comprovantes` | 003 | ❌ **PENDENTE** | ✅ 3 policies (definidas) | PK id, FK user_id, status check | Requer mig 003 no Supabase |
| `agentes_config` | 003 | ❌ **PENDENTE** | ✅ 2 policies (definidas) | PK id, UNIQUE(cargo, agente) | Seed 33 rows definido |
| `message_buffer` | 003 | ❌ **PENDENTE** | ✅ 1 policy (definida) | PK id, FK user_id | Code node n8n salva aqui |

**Funções/Triggers:**
- `handle_new_user()` + trigger `on_auth_user_created` ✅ (mig 001)

**Buckets Storage:** Não definidos em migrations ❌

---

## 7. APIs — STATUS

| Rota | Método | Status | Auth | Descrição |
|------|--------|--------|------|-----------|
| `/api/dashboard` | GET | ✅ Completo | Admin client | Rankings + totais |
| `/api/agentes-config` | GET/PUT | ✅ Completo | Admin client | CRUD agentes_config |
| `/api/profile` | GET/PUT | ✅ Completo | Client | Perfil usuário |
| `/api/me` | GET | ✅ Completo | Client | Cargo usuário |
| `/api/create-user` | POST | ✅ Completo | Admin client | Cria auth user + profile |
| `/api/upload-avatar` | POST | ✅ Completo | Client | Upload → Storage |
| `/api/sync-funcionarios` | POST | ✅ Completo | Admin client | CSV/Excel → funcionarios |
| `/auth/callback` | GET | ✅ Completo | Público | OAuth callback |

---

## 8. FRONTEND — STATUS

| Página/Componente | Rota | Status | Linhas | Observação |
|-------------------|------|--------|--------|------------|
| Login | `/login` | ✅ | ~150 | AuthForm |
| Dashboard | `/crm` | ✅ | 341 | DashboardV2 |
| Chat | `/crm/chat` | ✅ | 374 | **ChatInterfaceV2** (TODO #10 refatorar) |
| Perfil | `/crm/perfil` | ✅ | 182 | Avatar, nome, cargo |
| Admin | `/admin` | ✅ | 137 | Sync, Create User |
| Admin Agentes | `/admin/agentes` | ✅ | 177 | Grid cargos × agentes |
| Sidebar | Layout | ✅ | - | Navegação |
| UI Components | - | ✅ 10 | - | Shadcn/UI |
| Hooks | `src/hooks/` | ❌ **VAZIO** | 0 | TODO #10: useChat, useFileUpload |

**Código Morto (não usado):**
- `chat-interface.tsx` (v1, 370 linhas)
- `dashboard.tsx` (v1)
- `proxy.ts` (apenas dev)

---

## 9. INTEGRAÇÕES — STATUS

| Integração | Status | Configuração | Gaps |
|------------|--------|--------------|------|
| **Supabase** | ✅ Conectado | URL, Anon Key, Service Role (admin) | Service Role hardcoded em n8n |
| **n8n** | ✅ Conectado | Webhook URL no .env, API Key em toggle_webhook.js | Webhook some após restart |
| **Gemini (Google AI)** | ✅ Credencial no n8n | API Key no n8n credentials | - |
| **Google Calendar** | ⚠️ Parcial | OAuth credencial no n8n, 6 tools nos workflows | **Redirect URI não registrada** |
| **Google Drive** | ❌ Ausente | Referenciado em comprovantes.arquivo_drive_id | OAuth + Storage buckets |
| **OCR.space** | ❌ Ausente | Necessário para Agente OCR | API Key + workflow |
| **WAHA (WhatsApp)** | ✅ Container rodando | docker-compose, webhook → n8n/webhook/waha | Webhook n8n não existe |
| **Telegram** | ⚠️ Parcial | Credencial no n8n, Agente_Agendamento inativo | Apenas no workflow inativo |
| **Playwright** | ✅ Configurado | tests/login.spec.ts | Sem testes E2E chat |
| **Power BI** | ❌ Ausente | ARCHITECTURE.md menciona | - |

---

## 10. PRÓXIMAS SPRINTS — ORDENADAS POR PRIORIDADE

### SPRINT 0 — PRÉ-REQUISITOS (Manual, Sem Código)
| Ação | Responsável | Tempo | Dependência |
|------|-------------|-------|-------------|
| Aplicar Migration 003 no Supabase SQL Editor | Dev | 10 min | Nenhuma |
| Registrar Redirect URI Google Calendar: `http://127.0.0.1:5678/rest/oauth2-credential/callback` | Dev | 10 min | Google Cloud Console |
| Exportar JSON dos 2 workflows n8n atuais (backup) | Dev | 5 min | n8n UI |

---

### SPRINT 1 — MASTER ROUTER + BUFFER FIX
**Objetivo:** Implementar Switch de roteamento no workflow CRM Chat + corrigir buffer file_data
**Domínio:** Automações (n8n)
**Arquivos Envolvidos:**
- n8n: Workflow WFCRM001chat01 (modificar: adicionar Switch + 2 HTTP Request nodes)
- n8n: Code node "Salvar no Buffer" (corrigir file_data BYTEA)
**Risco:** Quebrar fluxo atual do chat se Switch mal configurado
**Tempo Estimado:** 4-6h
**Dependências:** Sprint 0 (migração 003 aplicada — tabela message_buffer existe)

---

### SPRINT 2 — AGENTE OCR (COMPROVANTE)
**Objetivo:** Criar workflow independente `/webhook/agent-comprovante`
**Domínio:** Automações (n8n) + OCR
**Arquivos Envolvidos:**
- n8n: Novo workflow (export JSON para versionamento)
- n8n: Credencial OCR.space API Key
**Nós:** Webhook → HTTP Request (OCR.space) → Parse JSON → IF (confidence > 80%) → Set Response → (else) Error Response
**Risco:** OCR.space rate limits, formato resposta variável
**Tempo Estimado:** 6-8h
**Dependências:** Sprint 1 (Master Router roteia para este webhook), Sprint 0 (tabela comprovantes existe)

---

### SPRINT 3 — AGENTE CONCILIAÇÃO (CTN + EXTRATO)
**Objetivo:** Criar workflow independente `/webhook/agent-conciliacao`
**Domínio:** Automações (n8n)
**Arquivos Envolvidos:**
- n8n: Novo workflow (export JSON)
**Nós:** Webhook → Parse CSV/XLS (Code node ou Spreadsheet File) → Query Supabase comprovantes → Matcher (lógica de cruzamento) → Set Response
**Risco:** Complexidade do matcher, performance em datasets grandes
**Tempo Estimado:** 8-12h
**Dependências:** Sprint 1 (Master Router roteia), Sprint 0 (tabela comprovantes existe)

---

### SPRINT 4 — AUTO-TOGGLE WEBHOOK + HEALTHCHECK
**Objetivo:** Eliminar toggle manual pós-restart n8n
**Domínio:** Infra/Automações
**Arquivos Envolvidos:**
- `docker-compose.yml` (adicionar healthcheck n8n + entrypoint script)
- Novo script: `n8n/entrypoint.sh` (wait for n8n API → toggle webhook via API)
**Risco:** Entrypont mal configurado impede startup do container
**Tempo Estimado:** 3-4h
**Dependências:** Nenhuma (pode ser paralelo)

---

### SPRINT 5 — CREDENCIAIS EM ENV/SECRETS
**Objetivo:** Remover hardcoded keys (n8n API Key, Supabase Service Key, OCR.space)
**Domínio:** Segurança
**Arquivos Envolvidos:**
- `toggle_webhook.js` → ler `N8N_API_KEY` de process.env
- n8n workflow CRM Chat: Code node "Salvar no Buffer" → usar credential n8n (Supabase) ou env var
- Docker Compose: adicionar secrets ou env vars
- `.gitignore`: garantir ngrok.exe, .env.local não versionados
**Risco:** Quebra de funcionalidade se env var não propagada corretamente
**Tempo Estimado:** 2-3h
**Dependências:** Sprint 4 (healthcheck garante n8n API disponível)

---

### SPRINT 6 — TESTES E2E CHAT + REFACTOR CHATINTERFACE
**Objetivo:** Playwright tests para fluxo chat + extrair hooks
**Domínio:** Qualidade/Frontend
**Arquivos Envolvidos:**
- `crm/tests/chat.spec.ts` (novo)
- `crm/src/hooks/useChat.ts` (novo)
- `crm/src/hooks/useFileUpload.ts` (novo)
- `crm/src/components/chat-interface-v2.tsx` (refatorar para usar hooks)
**Risco:** Refatoração introduz bugs no componente principal
**Tempo Estimado:** 6-8h
**Dependências:** Sprint 1 (chat funcional com router)

---

### SPRINT 7 — GOOGLE DRIVE + STORAGE BUCKETS
**Objetivo:** Upload comprovantes → Google Drive + Supabase Storage
**Domínio:** Integrações/Arquivos
**Arquivos Envolvidos:**
- Supabase: Criar buckets `avatars`, `comprovantes` (SQL ou Dashboard)
- n8n: Google Drive OAuth credencial + nodes Upload/Download
- Agente OCR: Salvar arquivo no Drive, gravar `arquivo_drive_id` em comprovantes
- Frontend: Upload avatar já usa `/api/upload-avatar` (verificar bucket)
**Risco:** OAuth scopes, permissões Drive API
**Tempo Estimado:** 6-8h
**Dependências:** Sprint 2 (Agente OCR precisa salvar arquivo), Sprint 5 (credenciais em secrets)

---

### SPRINT 8 — AGENTE AGENDA INDEPENDENTE + TELEGRAM
**Objetivo:** Separar Agenda do AI Agent principal + ativar Telegram
**Domínio:** Automações
**Arquivos Envolvidos:**
- n8n: Novo workflow Agente Agenda (HTTP Request trigger)
- n8n: Ativar Agente_Agendamento (Telegram) ou migrar para novo workflow
- CRM Chat: Remover tools Calendar do AI Agent principal, chamar Agente Agenda via HTTP
**Risco:** Duplicação de lógica, quebra de agendamentos existentes
**Tempo Estimado:** 4-6h
**Dependências:** Sprint 1 (Master Router), Sprint 0 (OAuth Calendar funcionando)

---

### SPRINT 9 — POWER BI / RELATÓRIOS AVANÇADOS
**Objetivo:** Dashboards executivos, exportações agendadas
**Domínio:** BI
**Arquivos Envolvidos:**
- Supabase: Views/Functions para métricas agregadas
- n8n: Workflow agendado → export CSV/Excel → Google Drive/Email
- Power BI: Dataset conectado no Supabase (DirectQuery ou Refresh)
**Tempo Estimado:** 8-16h
**Dependências:** Sprint 0, 1, 7 (dados completos no banco)

---

### SPRINT 10 — LIMPEZA + DOCUMENTAÇÃO
**Objetivo:** Remover scripts debug, documentar workflows, backup JSON versionado
**Domínio:** Manutenção
**Arquivos Envolvidos:**
- Raiz: Remover ~40 scripts `.js` (manter apenas `toggle_webhook.js`, `restart_n8n.bat`)
- n8n: Exportar JSON de todos workflows ativos → versionar em `n8n/workflows/`
- Atualizar `STATUS.md`, `TODO_NEXT.md`, `ARCHITECTURE_REVIEW.md`
**Tempo Estimado:** 2-3h
**Dependências:** Todas anteriores estabilizadas

---

## RESUMO DE DEPENDÊNCIAS ENTRE SPRINTS

```
SPRINT 0 (Manual)
    ↓
SPRINT 1 (Master Router) ←───┐
    ↓                        │
SPRINT 2 (OCR)               │
    ↓                        │
SPRINT 3 (Conciliação)       │
    ↓                        │
SPRINT 4 (Auto-toggle)  ────┤ (Paralelo, pode rodar a qualquer momento após Sprint 0)
    ↓                        │
SPRINT 5 (Secrets)      ────┤ (Paralelo, após Sprint 4)
    ↓                        │
SPRINT 6 (Tests/Refactor)   │
    ↓                        │
SPRINT 7 (Drive/Storage) ───┤ (Precisa Sprint 2 + 5)
    ↓                        │
SPRINT 8 (Agenda/Telegram)──┘ (Precisa Sprint 1 + 0)
    ↓
SPRINT 9 (Power BI)
    ↓
SPRINT 10 (Cleanup)
```

---

**NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.**