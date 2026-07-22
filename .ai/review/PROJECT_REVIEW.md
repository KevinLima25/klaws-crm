# PROJECT REVIEW

## 1. Informações Gerais

| Campo | Valor |
|---|---|
| **Data** | 22/07/2026 |
| **Sprint atual** | Sprint 1 (Master Router + OCR + Conciliação) |
| **Commit atual** | `19be13a` |
| **Branch** | `master` |
| **Último commit** | `19be13a90c0f47582b368ff985f10d1d13542116` - 2026-07-21 10:32:05 -0300 - "feat: profile page with avatar, name, email, cargo" |
| **Versão do projeto** | 0.1.0 |
| **Status geral** | EM DESENVOLVIMENTO - Frontend funcional, n8n parcial, integrações pendentes |

---

## 2. Arquitetura Atual

### Frontend
Next.js 16.2.10 + React 19.2.4 + Tailwind CSS v4 + shadcn/ui v4. Aplicação CRM com autenticação Supabase SSR, dashboard, chat com IA, perfil de usuário e painel admin. Interface exclusivamente de apresentação — regras de negócio delegadas para API/n8n/Supabase. Sidebar com navegação baseada em cargo (RBAC via `src/lib/roles.ts`). Chat envia mensagens para webhook n8n e persiste no Supabase.

### Backend
Não há backend tradicional. O backend é composto por:
- **API Routes Next.js** (7 endpoints) — utilizam `createAdminClient()` com Service Role Key para operações administrativas
- **Supabase** — banco de dados, autenticação, storage, RLS
- **n8n** — orquestrador de workflows (agentes de IA, OCR, conciliação)

### Supabase
Fonte única dos dados. 6 tabelas: `profiles`, `chat_messages`, `funcionarios`, `comprovantes`, `agentes_config`, `message_buffer`. Migrations versionadas (3 arquivos). RLS configurado por tabela. Trigger `handle_new_user()` para auto-criação de profile. Storage bucket `avatars`. **Migration 00003 não aplicada** (tabelas `comprovantes`, `agentes_config`, `message_buffer` não existem no banco).

### n8n
Orquestrador de fluxos. 2 workflows ativos: `WFCRM001chat01` (CRM Chat) e `WFCRM001ocr01` (Agente Comprovante/OCR). Dados armazenados em SQLite (`n8n/data/database.sqlite`). Webhook público via ngrok. **Workflows sem backup JSON exportado** — risco de perda total.

### Docker
3 containers em rede bridge `automation`:
- **waha** (devlikeapro/waha) — WhatsApp API, porta 3000
- **n8n** (n8nio/n8n) — Workflow engine, porta 5678
- **crm** (build local) — Next.js, porta 3001

### Playwright
Framework de testes E2E configurado. Apenas 1 teste de login implementado. Sem testes para chat, dashboard, admin, ou fluxos n8n.

### WAHA
WhatsApp API rodando em container Docker. Sessão webjs conectada. Webhook configurado para `http://host.docker.internal:5678/webhook/waha`. **Webhook WAHA inexistente no n8n** — mensagens do WhatsApp não são processadas.

### Telegram
Mencionado na arquitetura. Workflow inativo `UH5kg99biTCqPZ1F` (Agente_Agendamento) possui trigger Telegram. **Não integrado functionalmente.**

### Google Drive
Não configurado. Sem OAuth registrado. Pastas de comprovantes inexistentes. Mencionado como armazenamento futuro de comprovantes OCR.

### Google Calendar
OAuth configurado parcialmente no n8n (credencial existe) mas **redirect URI não registrado no Google Cloud Console**. Ferramentas de calendário (VERIFICAR AGENDA, Criar Evento, Delete) existem no workflow CRM Chat mas falham por falta de autenticação.

### OCR
OCR.space configurado no workflow `WFCRM001ocr01`. Nó HTTP Request node para API OCR.space falha com **HTTP 400 "Bad request - please check your parameters"** — API key inválida ou não configurada. Todas as 10+ execuções falharam.

### Conciliação
Não implementado. Workflow de conciliação não criado. Fluxo de CTN + extrato bancário não existe.

### Dashboard
2 versões: `dashboard.tsx` (original, 130 linhas) e `dashboard-v2.tsx` (341 linhas). Consome dados de `/api/dashboard` que consulta tabelas `funcionarios`, `vendas`, `adimplencia`. Rankings de vendas e adimplência com filtragem por cargo. **Indicadores calculados via API Route, não via Views SQL.**

### Fluxo geral da aplicação

```
Usuário → Login (Supabase Auth) → Frontend (Next.js)
  ├── Dashboard ← /api/dashboard ← Supabase (vendas, adimplencia)
  ├── Chat → FormData → Webhook n8n (/webhook/crm-chat)
  │     → Buffer (Code node) → AI Agent (Gemini) → Resposta
  │     → Persiste em chat_messages (Supabase)
  ├── Perfil ← /api/me → /api/profile → /api/upload-avatar
  └── Admin → /api/create-user → /api/sync-funcionarios → /api/agentes-config
```

---

## 3. Estrutura do Projeto

```
KLAWS CRM/
├── .ai/                           # Documentação do projeto
│   ├── ARCHITECTURE.md            # Arquitetura oficial
│   ├── CONTRACT.md                # Contrato de desenvolvimento IA
│   ├── sprints/                   # Definições de sprints
│   ├── reports/                   # Relatórios de auditoria
│   └── review/                    # Project Review (este documento)
├── crm/                           # Frontend Next.js
│   ├── src/
│   │   ├── app/                   # App Router (pages + API)
│   │   │   ├── admin/             # Admin pages
│   │   │   ├── api/               # 7 API routes
│   │   │   ├── auth/              # Auth callback
│   │   │   ├── crm/               # CRM pages (dashboard, chat, perfil)
│   │   │   └── login/             # Login page
│   │   ├── components/            # UI + feature components
│   │   │   └── ui/                # shadcn/ui primitives
│   │   ├── lib/                   # Supabase clients, roles, utils
│   │   └── proxy.ts               # Auth middleware
│   ├── supabase/migrations/       # 3 migration files
│   └── tests/                     # Playwright tests
├── n8n/                           # n8n data
│   ├── data/
│   │   ├── database.sqlite        # Workflows + credentials
│   │   ├── config                 # Encryption key
│   │   ├── storage/               # Execution binary data
│   │   └── n8nEventLog*.log       # Event logs
│   └── files/                     # Host file mount (vazio)
├── waha/                          # WAHA WhatsApp
│   ├── sessions/                  # Sessões WhatsApp
│   └── media/                     # Mídias (vazio)
├── docker-compose.yml             # 3 serviços
└── [scripts]                      # 75+ scripts .js/.py/.bat
```

---

## 4. Arquivos Modificados desde o último Sprint

### Últimos 5 commits (Sprint atual: Perfil + Sidebar)

| Arquivo | Tipo | Criado | Alterado | Removido | Resumo da alteração |
|---|---|---|---|---|---|
| `crm/src/app/api/profile/route.ts` | API | ✔ | | | Nova rota PUT /api/profile para atualizar nome e avatar_url |
| `crm/src/app/api/upload-avatar/route.ts` | API | ✔ | | | Nova rota POST /api/upload-avatar para upload de avatar no Storage |
| `crm/src/app/crm/perfil/page.tsx` | Página | ✔ | | | Nova página de perfil com avatar, nome, email, cargo |
| `crm/src/components/crm-sidebar.tsx` | Componente | | ✔ | | Sidebar condicional para admin + badge de chat não lido |
| `crm/src/app/api/me/route.ts` | API | | ✔ | | Adicionado fallback para /api/me?userId= e busca de cargo |
| `crm/src/app/api/dashboard/route.ts` | API | | ✔ | | Refatorado para usar admin client e filtragem client-side de cargo |
| `crm/src/components/dashboard-v2.tsx` | Componente | | ✔ | | Adicionado fallback de cargo via /api/me |

### Não versionados (untracked)

| Arquivo | Tipo | Resumo |
|---|---|---|
| `docker-compose.yml` | Config | Modificado (não commitado) |
| `crm/src/components/chat-interface-v2.tsx` | Componente | Modificado (não commitado) |
| `crm/src/components/crm-sidebar.tsx` | Componente | Modificado (não commitado) |
| `n8n/data/database.sqlite` | Dados | Modificado (não commitado) |
| `waha/sessions/webjs/waha.sqlite3-shm` | Dados | Modificado (não commitado) |
| `waha/sessions/webjs/waha.sqlite3-wal` | Dados | Modificado (não commitado) |
| `.ai/` (completo) | Docs | ~22 arquivos não versionados |
| `75+ scripts` (.js/.py/.bat) | Scripts | Scripts de auditoria/fix/deploy não versionados |

---

## 5. APIs

### API Routes (Next.js)

| # | Método | URL | Payload | Resposta | Status | Observações |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/agentes-config` | — | `{configs: Array<{id,cargo,agente,enabled}>}` | ✅ Funcional | Admin client, sem cache |
| 2 | PUT | `/api/agentes-config` | `{configs: [{cargo,agente,enabled}]}` | `{configs: Array}` | ✅ Funcional | Upsert por conflito (cargo,agente) |
| 3 | POST | `/api/create-user` | `{email,name?,cargo?,password?}` | `{status,email,name,cargo}` | ✅ Funcional | Senha padrão: `{user}Kl@ws2026`. Cria ou atualiza perfil |
| 4 | GET | `/api/dashboard` | — | `{vendasRanking,adimplenciaRanking,totais}` | ✅ Funcional | Consulta funcionarios, vendas, adimplencia. Admin client |
| 5 | GET | `/api/me?userId=` | Query `userId` opcional | `{id,email,name,cargo,avatar_url}` | ✅ Funcional | Fallback: profiles -> listUsers |
| 6 | PUT | `/api/profile?userId=` | `{name?,avatar_url?}` | `{status,full_name?,avatar_url?}` | ✅ Funcional | Atualiza profiles + metadata |
| 7 | POST | `/api/sync-funcionarios` | — | `{total,created,already_exists,errors}` | ✅ Funcional | Sync em massa de funcionarios para Auth |
| 8 | GET | `/api/sync-funcionarios` | — | `{message,example}` | ✅ Funcional | Apenas info |
| 9 | POST | `/api/upload-avatar?userId=` | `multipart/form-data (file)` | `{avatar_url}` | ✅ Funcional | Storage bucket `avatars`, auto-cria se não existe |

### Webhooks (n8n)

| # | Método | URL | Payload | Resposta | Status | Observações |
|---|---|---|---|---|---|---|
| 1 | POST | `/webhook/crm-chat` | FormData: `user_id,name,cargo,message,source,files[]` | `{text: string}` | ✅ Funcional | Webhook do CRM Chat. Precisa ser reativado após restart |
| 2 | POST | `/webhook/agent-ocr` | FormData com PDF/comprovante | OCR.space response | ❌ Falhando | Todas execuções falham (HTTP 400) |
| 3 | POST | `/webhook/waha` | WAHA message events | — | ❌ Não existe | Configurado no WAHA mas webhook não registrado no n8n |

### n8n API

| # | Método | URL | Payload | Resposta | Status | Observações |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/v1/workflows/{id}/activate` | `{}` | Workflow ativado | ✅ Funcional | Requer body `{}` vazio |
| 2 | POST | `/api/v1/workflows/{id}/deactivate` | `{}` | Workflow desativado | ✅ Funcional | Requer body `{}` vazio |
| 3 | GET | `/api/v1/workflows` | — | Lista de workflows | ✅ Funcional | Autenticação por API Key |

---

## 6. Workflows n8n

### Workflow 1: CRM Chat (Simplified Webhook)

| Campo | Valor |
|---|---|
| **ID** | `WFCRM001chat01` |
| **Nome** | CRM Chat (Simplified Webhook) |
| **Status** | ✅ ATIVO |
| **Webhook** | `POST /webhook/crm-chat` (webhookId: null — **bug de persistência**) |
| **Versão ativa** | `edc19c54-f15a-442f-b2aa-21d34c707b50` |
| **Modo de ativação** | `init` (inicia com n8n) |

**Nós identificados:**

| # | Nome | Tipo | Função |
|---|---|---|---|
| 1 | CRM Webhook | n8n-nodes-base.webhook | Recebe POST com FormData (message, files, user_id, name, cargo, source) |
| 2 | Salvar no Buffer | n8n-nodes-base.code | Salva mensagem no Supabase `message_buffer` via `this.helpers.httpRequest()` (workaround para bug do HTTP Request node v4.2) |
| 3 | DADOS | n8n-nodes-base.set | Prepara dados para o AI Agent |
| 4 | AI Agent | @n8n/n8n-nodes-langchain.agent | Agente de IA com ferramentas de calendário |
| 5 | Simple Memory | @n8n/n8n-nodes-langchain.memoryBufferWindow | Memória de conversa |
| 6 | Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | Modelo de IA Gemini |
| 7 | VERIFICAR AGENDA | (tool) | Ferramenta de calendário |
| 8 | Criar Evento | (tool) | Ferramenta de calendário |
| 9 | Delete an event in Google Calendar | (tool) | Ferramenta de calendário |
| 10 | Format Response | n8n-nodes-base.set | Formata resposta para o frontend |

**Fluxo resumido:**
```
Webhook (/crm-chat) → Salvar no Buffer (Code) → DADOS (Set) → AI Agent (Gemini)
  ├── Simple Memory (contexto)
  ├── VERIFICAR AGENDA (tool)
  ├── Criar Evento (tool)
  └── Delete Calendar Event (tool)
→ Format Response → Retorno JSON
```

**Dependências:** Supabase (message_buffer), Google Gemini API (chave configurada), Google Calendar OAuth (não funcional)

**Pendências:** webhookId null (precisa reativar pós-restart), Google Calendar tools sem autenticação, HTTP Request node bug (v4.2 TypeError)

### Workflow 2: Agente Comprovante (OCR)

| Campo | Valor |
|---|---|
| **ID** | `WFCRM001ocr01` |
| **Nome** | Agente Comprovante (OCR) |
| **Status** | ✅ ATIVO (foi desativado/reativado múltiplas vezes) |
| **Webhook** | `POST /webhook/agent-ocr` |
| **Versão ativa** | `0c86652cd3e647de80025e1b57fd05ef` |

**Nós identificados:**

| # | Nome | Tipo | Função |
|---|---|---|---|
| 1 | Webhook OCR | n8n-nodes-base.webhook | Recebe POST com comprovante |
| 2 | OCR.space | n8n-nodes-base.httpRequest | Envia imagem/PDF para OCR.space API |

**Fluxo resumido:**
```
Webhook (/agent-ocr) → OCR.space (HTTP Request) → [falha]
```

**Status:** ❌ **Todas as execuções (93, 94, 95, 96 e anteriores) falham** com:
- `"Bad request - please check your parameters"` (HTTP 400)
- Causa: API key OCR.space inválida/não configurada

**Dependências:** OCR.space API Key, Supabase Storage (para arquivos)

**Pendências:** Chave OCR.space não configurada, webhook não persistente, validação de resposta não implementada

### Workflow 3: Agente_Agendamento (Inativo)

| Campo | Valor |
|---|---|
| **ID** | `UH5kg99biTCqPZ1F` |
| **Nome** | Agente_Agendamento |
| **Status** | ❌ INATIVO |
| **Webhook** | Telegram trigger |
| **Nós** | 10 nós (Telegram + Google Calendar) |

**Observação:** Este workflow duplica funcionalidades de calendário já existentes no CRM Chat. Não aparece nos logs recentes de ativação. Candidato à remoção ou arquivamento.

### Pendências Gerais n8n

| Pendência | Impacto |
|---|---|
| Nenhum workflow possui backup JSON exportado | Risco de perda total dos workflows |
| workflowId nulo no webhook CRM Chat | Webhook some após restart do n8n |
| HTTP Request node v4.2 com TypeError | Workaround via `this.helpers.httpRequest()` |
| OCR.space API key não configurada | Workflow OCR 100% quebrado |
| WAHA webhook (`/webhook/waha`) não existe | Mensagens WhatsApp não processadas |
| Google Calendar OAuth não funcional | Ferramentas de agenda quebradas |
| Workflow Agente_Agendamento inativo | Código morto ocupando espaço |

---

## 7. Banco de Dados

### Tabelas Supabase

| # | Tabela | Schema | Migration | Status | RLS |
|---|---|---|---|---|---|
| 1 | `profiles` | `id UUID PK, email TEXT, full_name TEXT, avatar_url TEXT, cargo TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | 00001 + 00002 | ✅ Aplicada | ✅ SELECT/UPDATE/INSERT own |
| 2 | `chat_messages` | `id UUID PK, user_id UUID FK, sender TEXT, message TEXT, source TEXT, created_at TIMESTAMPTZ` | 00001 | ✅ Aplicada | ✅ SELECT/INSERT own |
| 3 | `funcionarios` | (colunas dinâmicas de spreadsheet) | 00001 | ✅ Aplicada | ❌ Sem RLS |
| 4 | `vendas` | (colunas dinâmicas de spreadsheet) | 00001 | ✅ Aplicada | ❌ Sem RLS |
| 5 | `adimplencia` | (colunas dinâmicas de spreadsheet) | 00001 | ✅ Aplicada | ❌ Sem RLS |
| 6 | `comprovantes` | `id UUID PK, user_id UUID FK, nome_pagador TEXT, razao_social TEXT, nome_fantasia TEXT, data_hora TIMESTAMPTZ, valor NUMERIC, matriculas TEXT[], confidence_score NUMERIC, status TEXT, arquivo_url TEXT, arquivo_drive_id TEXT, observacao TEXT, approved_by UUID FK, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ` | 00003 | ❌ **Não aplicada** | ✅ SELECT own, SELECT/UPDATE assistente financeiro |
| 7 | `agentes_config` | `id UUID PK, cargo TEXT, agente TEXT, enabled BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, UNIQUE(cargo,agente)` | 00003 | ❌ **Não aplicada** | ✅ SELECT authenticated, ALL admin |
| 8 | `message_buffer` | `id UUID PK, user_id UUID FK, message TEXT, file_name TEXT, file_type TEXT, file_data BYTEA, processed BOOLEAN, created_at TIMESTAMPTZ` | 00003 | ❌ **Não aplicada** | ✅ INSERT own |

### Triggers

| Nome | Função | Objeto | Status |
|---|---|---|---|
| `on_auth_user_created` | `handle_new_user()` — insere perfil automaticamente | `auth.users` | ✅ Aplicada |

### Functions

| Nome | Descrição | Status |
|---|---|---|
| `handle_new_user()` | AFTER INSERT trigger em auth.users, cria perfil em profiles | ✅ Aplicada |

### Views

NÃO IMPLEMENTADO — Dashboard consulta tabelas diretamente via API Route. Arquitetura recomenda Views.

### RLS Policies

| Tabela | Policy | Escopo | Status |
|---|---|---|---|
| profiles | Users can view own profile | SELECT (auth.uid() = id) | ✅ |
| profiles | Users can update own profile | UPDATE (auth.uid() = id) | ✅ |
| profiles | Users can insert own profile | INSERT (auth.uid() = id) | ✅ |
| chat_messages | Users can view own messages | SELECT (auth.uid() = user_id) | ✅ |
| chat_messages | Users can insert own messages | INSERT (auth.uid() = user_id) | ✅ |
| comprovantes | Users can view own comprovantes | SELECT (auth.uid() = user_id) | ❌ Pendente |
| comprovantes | Assistente financeiro can view all | SELECT (cargo IN ('ASSISTENTE FINANCEIRO','GERENTE')) | ❌ Pendente |
| comprovantes | Assistente financeiro can update | UPDATE (cargo IN ('ASSISTENTE FINANCEIRO','GERENTE')) | ❌ Pendente |
| agentes_config | All authenticated can view | SELECT (auth.role() = 'authenticated') | ❌ Pendente |
| agentes_config | Admin can manage | ALL (cargo IN ('ASSISTENTE FINANCEIRO','GERENTE')) | ❌ Pendente |
| message_buffer | Users can insert own messages | INSERT (auth.uid() = user_id) | ❌ Pendente |
| funcionarios | — | Sem RLS | ⚠️ Risco |
| vendas | — | Sem RLS | ⚠️ Risco |
| adimplencia | — | Sem RLS | ⚠️ Risco |

### Migrations pendentes

| Migration | Arquivo | Status | Prioridade |
|---|---|---|---|
| 00003 | `crm/supabase/migrations/00003_add_comprovantes_agentes_config.sql` | ❌ **NÃO APLICADA** | 🔴 **CRÍTICA** |

---

## 8. Variáveis de Ambiente

### Frontend (`crm/.env.local`)

| Nome | Configurada | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configurada | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configurada | Chave anônima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurada | ⚠️ **Service Role — risco de exposição** |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | ✅ Configurada | ngrok URL para webhook n8n |

### Docker (`docker-compose.yml`)

| Nome | Configurada | Observação |
|---|---|---|
| `WAHA_DASHBOARD_USERNAME` | ✅ Configurada | Dashboard WAHA |
| `WAHA_DASHBOARD_PASSWORD` | ✅ Configurada | Senha WAHA |
| `WHATSAPP_SWAGGER_USERNAME` | ✅ Configurada | Swagger WAHA |
| `WHATSAPP_SWAGGER_PASSWORD` | ✅ Configurada | Senha Swagger |
| `WAHA_API_KEY` | ✅ Configurada | API Key WAHA |
| `TZ` | ✅ Configurada | America/Sao_Paulo |
| `WHATSAPP_HOOK_URL` | ✅ Configurada | Webhook WAHA → n8n |
| `WHATSAPP_HOOK_EVENTS` | ✅ Configurada | message.any |
| `N8N_HOST` | ✅ Configurada | localhost |
| `N8N_PORT` | ✅ Configurada | 5678 |
| `N8N_PROTOCOL` | ✅ Configurada | http |
| `N8N_WEBHOOK_URL` | ✅ Configurada | ngrok tunnel URL |
| `N8N_PROXY_HOPS` | ✅ Configurada | 1 |
| `N8N_ENCRYPTION_KEY` | ✅ Configurada | ⚠️ **Chave fixa exposta** |
| `N8N_RUNNERS_ENABLED` | ✅ Configurada | true |
| `GENERIC_TIMEZONE` | ✅ Configurada | America/Sao_Paulo |

### n8n (credenciais internas)

| Nome | Configurada | Observação |
|---|---|---|
| Google Gemini API Key | ✅ Configurada | Credencial n8n para AI Agent |
| Google Calendar OAuth2 | ⚠️ Parcial | OAuth configurado mas sem redirect URI registrado |
| OCR.space API Key | ❌ **Não configurada** | Workflow OCR 100% quebrado |
| Telegram API Token | ❌ **Não verificada** | Workflow Agendamento inativo |
| n8n API Key | ✅ Configurada | ⚠️ Exposta em scripts de toggle |

---

## 9. Docker

### Containers

| Container | Imagem | Status | Portas |
|---|---|---|---|
| `waha` | `devlikeapro/waha` | ✅ Running | 3000:3000 |
| `n8n` | `n8nio/n8n` | ✅ Running | 5678:5678 |
| `crm` | `crm` (build local) | ✅ Running | 3001:3000 |

### Volumes

| Volume | Mount | Propósito |
|---|---|---|
| `./waha/sessions:/app/.sessions` | bind | Sessões WhatsApp (persistência login) |
| `./waha/media:/app/.media` | bind | Mídias WhatsApp |
| `./n8n/data:/home/node/.n8n` | bind | Banco SQLite, credenciais, workflows |
| `./n8n/files:/files` | bind | Pasta de arquivos host (vazia) |
| `./crm:/app` | bind | Código do CRM (hot reload) |
| `/app/node_modules` | anonymous | Node modules (excluído do bind) |
| `/app/.next` | anonymous | Build cache (excluído do bind) |

### Networks

| Nome | Driver | Containers |
|---|---|---|
| `automation` | bridge | waha, n8n, crm |

### Problemas conhecidos

| Problema | Gravidade | Descrição |
|---|---|---|
| Sem healthcheck | 🔴 Alta | Nenhum container possui healthcheck configurado |
| ngrok URL hardcoded | 🟡 Média | `N8N_WEBHOOK_URL` aponta para ngrok free domain |
| WAHA webhook não existe no n8n | 🔴 Alta | WAHA envia eventos mas n8n não tem webhook `/webhook/waha` |
| CRM container sem restart policy explícita | 🟡 Média | Depende do restart: unless-stopped (herdado) |
| `./crm:/app` bind mount without optimization | 🟡 Média | Todo o código fonte montado, sem camadas de build |

---

## 10. Dependências

### Frontend (crm/)

| Pacote | Versão | Categoria |
|---|---|---|
| `next` | 16.2.10 | Framework |
| `react` | 19.2.4 | UI Library |
| `react-dom` | 19.2.4 | React DOM |
| `@supabase/ssr` | ^0.12.3 | Supabase SSR Auth |
| `@supabase/supabase-js` | ^2.110.7 | Supabase Client |
| `@radix-ui/react-avatar` | ^1.2.3 | UI Primitivo |
| `@radix-ui/react-dialog` | ^1.1.20 | UI Primitivo |
| `@radix-ui/react-dropdown-menu` | ^2.1.21 | UI Primitivo |
| `@radix-ui/react-label` | ^2.1.12 | UI Primitivo |
| `@radix-ui/react-scroll-area` | ^1.2.15 | UI Primitivo |
| `@radix-ui/react-separator` | ^1.1.12 | UI Primitivo |
| `@radix-ui/react-slot` | ^1.3.0 | UI Primitivo |
| `@radix-ui/react-tabs` | ^1.1.18 | UI Primitivo |
| `@radix-ui/react-toast` | ^1.2.20 | UI Primitivo |
| `@base-ui/react` | ^1.6.0 | Base UI (Button) |
| `class-variance-authority` | ^0.7.1 | UI Variants |
| `clsx` | ^2.1.1 | Classnames |
| `tailwind-merge` | ^3.6.0 | Tailwind Merge |
| `tw-animate-css` | ^1.4.0 | Animations |
| `lucide-react` | ^1.25.0 | Icons |
| `shadcn` | ^4.13.1 | CLI |
| `typescript` | ^5 | Language |
| `tailwindcss` | ^4 | CSS |
| `@playwright/test` | ^1.61.1 | E2E Testing |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.10 | ESLint Config |

### n8n Nodes

| Pacote | Versão | Categoria |
|---|---|---|
| `n8n-nodes-base` | (built-in) | Nodes padrão (webhook, code, set, HTTP request) |
| `@n8n/n8n-nodes-langchain` | (built-in) | AI Agent, Gemini Chat Model, Memory, Calendar Tools |

### WAHA

| Imagem | Versão | Categoria |
|---|---|---|
| `devlikeapro/waha` | latest | WhatsApp API |

### Docker

| Imagem | Versão | Categoria |
|---|---|---|
| `n8nio/n8n` | latest | Workflow Engine |
| `node` | 20-alpine | Node.js Runtime (build) |

---

## 11. Testes

### Playwright E2E

| Teste | Arquivo | Resultado | Status |
|---|---|---|---|
| Login page display | `tests/login.spec.ts` | ✅ PASS | Funcional |
| Register mode toggle | `tests/login.spec.ts` | ✅ PASS | Funcional |
| Unauthenticated redirect | `tests/login.spec.ts` | ✅ PASS | /crm/chat → /login |

### Testes Manuais

| Fluxo | Resultado | Status | Data |
|---|---|---|---|
| Text message via chat-interface-v2 | ✅ PASS | Buffer + AI Agent + resposta | 21/07/2026 |
| Buffer via Code node (helpers.httpRequest) | ✅ PASS | Workaround HTTP Request node bug | 21/07/2026 |
| Webhook toggle via n8n API | ✅ PASS | Ativar/desativar com body `{}` | 21/07/2026 |
| File upload via chat (PDF) | ❌ **NÃO TESTADO** | Anexo é enviado ao webhook mas sem fluxo de processamento | — |
| OCR / Agente Comprovante | ❌ **FALHA** | HTTP 400 - OCR.space API key inválida | 21/07/2026 |
| Conciliação | ❌ **NÃO TESTADO** | Workflow não existe | — |
| Routing by file type | ❌ **NÃO TESTADO** | Master Router sem Switch | — |
| Google Calendar | ❌ **NÃO TESTADO** | OAuth não configurado | — |
| WAHA webhook | ❌ **NÃO TESTADO** | Webhook não existe no n8n | — |
| Admin agentes config page | ❌ **NÃO TESTADO** | Página criada mas sem teste | — |

### Cobertura

| Camada | Cobertura Estimada | Observação |
|---|---|---|
| Frontend (unitário) | 0% | Nenhum teste unitário |
| Frontend (E2E) | ~10% | Apenas login |
| API Routes | 0% | Nenhum teste de API |
| n8n Workflows | ~30% | Apenas fluxo básico do chat |
| Supabase RLS | 0% | Nenhum teste de política |
| Integrações | 0% | Nenhuma integração testada |

---

## 12. Bugs Conhecidos

| # | Bug | Gravidade | Workaround | Status |
|---|---|---|---|---|
| 1 | Webhook n8n desaparece após restart | 🔴 **Crítica** | Reativar manualmente via `toggle_webhook.js` | 🔴 Aberto |
| 2 | HTTP Request node v4.2 TypeError | 🔴 **Alta** | Usar `this.helpers.httpRequest()` no Code node | 🟡 Aberto |
| 3 | OCR.space API key inválida/não configurada | 🔴 **Alta** | Nenhum — workflow 100% quebrado | 🔴 Aberto |
| 4 | Google Calendar OAuth sem redirect URI | 🔴 **Alta** | Nenhum — ferramentas de calendário quebradas | 🔴 Aberto |
| 5 | n8n API deactivate/activate requer body `{}` vazio | 🟡 **Média** | Sempre incluir `{}` no body | 🟡 Aberto |
| 6 | webhookId nulo no CRM Chat workflow | 🟡 **Média** | Reativar workflow pós-restart | 🟡 Aberto |
| 7 | n8n API Key hardcoded em scripts de toggle | 🟡 **Média** | Nenhum — exposto em toggle_webhook.js | 🟡 Aberto |
| 8 | ngrok.exe versionado no repositório | 🟢 **Baixa** | Adicionar ao .gitignore | 🟢 Aberto |
| 9 | WAHA webhook (`/webhook/waha`) não existe no n8n | 🟡 **Média** | Nenhum — mensagens WAHA perdidas | 🔴 Aberto |
| 10 | 75+ scripts de debug poluindo raiz do projeto | 🟢 **Baixa** | Mover para pasta scripts/ | 🟢 Aberto |

---

## 13. Dívida Técnica

### 🔴 Alta Prioridade

| # | Item | Esforço | Risco | Observação |
|---|---|---|---|---|
| 1 | Migration 00003 não aplicada no Supabase | 5min | 🔴 Alto | Tabelas comprovantes, agentes_config, message_buffer não existem |
| 2 | Workflows n8n sem backup JSON | 30min | 🔴 Alto | Risco de perda total dos workflows |
| 3 | Google Calendar OAuth não configurado | 1h | 🔴 Alto | Ferramentas de agenda quebradas |
| 4 | OCR.space API key não configurada | 15min | 🔴 Alto | Workflow OCR 100% quebrado |
| 5 | Webhook CRM Chat não persiste após restart | 2h | 🔴 Alto | Interrupção do serviço de chat |

### 🟡 Média Prioridade

| # | Item | Esforço | Risco | Observação |
|---|---|---|---|---|
| 6 | Master Router linear (sem Switch node) | 3h | 🟡 Médio | Todo tráfego vai para AI Agent. Sem roteamento por tipo |
| 7 | Functionalidades v1 e v2 duplicadas (dashboard, chat) | 4h | 🟡 Médio | Código morto aumenta complexidade |
| 8 | Sem healthcheck em containers Docker | 1h | 🟡 Médio | Impossível monitorar saúde dos serviços |
| 9 | HTTP Request node bug força uso de Code node | — | 🟡 Médio | Workaround aumenta complexidade do workflow |
| 10 | WAHA webhook não registrado no n8n | 1h | 🟡 Médio | Mensagens WhatsApp não processadas |
| 11 | n8n API Key hardcoded em scripts | 30min | 🟡 Médio | Risco de exposição |

### 🟢 Baixa Prioridade

| # | Item | Esforço | Risco | Observação |
|---|---|---|---|---|
| 12 | 75+ scripts de debug na raiz | 30min | 🟢 Baixo | Poluição visual, sem impacto funcional |
| 13 | ngrok.exe versionado | 1min | 🟢 Baixo | Adicionar ao .gitignore |
| 14 | Sem testes E2E para chat/dashboard/admin | 2d | 🟢 Baixo | Cobertura geral baixa |
| 15 | Hooks directory vazio | — | 🟢 Baixo | Estrutura incompleta |
| 16 | `crm/src/hooks/` vazio | — | 🟢 Baixo | Estrutura planejada mas não implementada |
| 17 | Dashboard calcula indicadores via API em vez de Views SQL | 4h | 🟢 Baixo | Arquitetura recomenda Views |

---

## 14. Segurança

### Secrets Hardcoded

| # | Local | Secret | Risco |
|---|---|---|---|
| 1 | `docker-compose.yml` | `N8N_ENCRYPTION_KEY=N8N_ENCRYPTION_KEY_REMOVED` | 🔴 **Crítico** — Qualquer um com acesso ao repo descriptografa credenciais n8n |
| 2 | `docker-compose.yml` | `WAHA_API_KEY=WAHA_API_KEY_REMOVED` | 🔴 **Crítico** — API Key do WhatsApp exposta |
| 3 | `docker-compose.yml` | `WAHA_DASHBOARD_USERNAME=USERNAME_REMOVED`, `WAHA_DASHBOARD_PASSWORD=PASSWORD_REMOVED` | 🟡 Médio — Credenciais WAHA Dashboard |
| 4 | `crm/.env.local` | `SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY_REMOVED` | 🔴 **Crítico** — Service Role Key exposta. Permite superusuário no banco |
| 5 | `crm/.env.local` | `NEXT_PUBLIC_N8N_WEBHOOK_URL` (contém ngrok domain) | 🟢 Baixo — URL pública |
| 6 | `toggle_webhook.js` | n8n API Key hardcoded | 🟡 Médio — Exposição da chave de API |
| 7 | fix_webhook.js, fix_webhook_db.js, etc. | URLs e configurações internas | 🟡 Médio — Múltiplos scripts com dados sensíveis |

### URLs Hardcoded

| # | Local | URL | Risco |
|---|---|---|---|
| 1 | `docker-compose.yml` | `N8N_WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/` | 🟡 Médio — ngrok URL pública e instável |
| 2 | `crm/.env.local` | `NEXT_PUBLIC_N8N_WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` | 🟡 Médio — ngrok URL pública |
| 3 | `docker-compose.yml` | `WHATSAPP_HOOK_URL=http://host.docker.internal:5678/webhook/waha` | 🟢 Baixo — URL interna Docker |
| 4 | `crm/.env.local` | `NEXT_PUBLIC_SUPABASE_URL=https://wbmljquydsatacqerlzv.supabase.co` | 🟢 Baixo — URL pública do projeto |

### Service Keys

| Chave | Local | Risco |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `crm/.env.local` (não versionado) | 🔴 **Crítico** — Acesso total ao banco |
| `N8N_ENCRYPTION_KEY` | `docker-compose.yml` (versionado) | 🔴 **Crítico** — Permite descriptografar credenciais n8n |
| `N8N_API_KEY` | `toggle_webhook.js` (versionado) | 🟡 Médio — Acesso à API n8n |

### Credenciais

| Sistema | Status | Observação |
|---|---|---|
| Supabase Auth | ✅ OK | Usuários autenticados via email/senha |
| Google Gemini API | ✅ Configurada | Credencial no n8n |
| Google Calendar OAuth | ❌ **Não funcional** | Redirect URI não registrado |
| Google Drive OAuth | ❌ **Não configurado** | — |
| OCR.space API | ❌ **Não configurada** | Chave não encontrada |
| Telegram Bot Token | ❌ **Não verificado** | Workflow inativo |
| WAHA API Key | ✅ Configurada (hardcoded) | Exposta no docker-compose.yml |

### RLS

| Tabela | RLS | Risco |
|---|---|---|
| profiles | ✅ Ativo | Apenas próprio usuário |
| chat_messages | ✅ Ativo | Apenas próprio usuário |
| comprovantes | ❌ **Migration não aplicada** | Sem RLS até migration ser executada |
| agentes_config | ❌ **Migration não aplicada** | Sem RLS até migration ser executada |
| message_buffer | ❌ **Migration não aplicada** | Sem RLS até migration ser executada |
| funcionarios | ❌ **Sem RLS** | 🔴 **Risco** — Dados de funcionários expostos |
| vendas | ❌ **Sem RLS** | 🔴 **Risco** — Dados de vendas expostos |
| adimplencia | ❌ **Sem RLS** | 🔴 **Risco** — Dados financeiros expostos |

### OAuth

| Provedor | Status | Risco |
|---|---|---|
| Google Calendar | ⚠️ Parcial (configurado no n8n, redirect URI não registrado) | 🔴 **Alto** |
| Google Drive | ❌ Não configurado | 🟡 Médio |
| Supabase Auth (email) | ✅ Funcional | 🟢 Baixo |

### Riscos de Segurança Adicionais

| Risco | Gravidade | Descrição |
|---|---|---|
| Service Role Key usada em API Routes Next.js | 🔴 **Crítico** | Qualquer vulnerabilidade em API Route expõe acesso total ao banco |
| N8N_ENCRYPTION_KEY fixa e versionada | 🔴 **Crítico** | Permite decriptar todas as credenciais armazenadas no n8n |
| ngrok usado como webhook público | 🟡 Médio | URL pública instável, sem HTTPS confiável, sujeita a interceptação |
| .env.example não inclui SUPABASE_SERVICE_ROLE_KEY | 🟡 Médio | Inconsistência — service role não documentada mas usada |
| 3 tabelas (funcionarios, vendas, adimplencia) sem RLS | 🔴 **Alto** | Qualquer usuário autenticado pode ler dados de todos os funcionários/vendas |

---

## 15. Performance

### Possíveis Gargalos

| # | Componente | Gargalo | Impacto | Observação |
|---|---|---|---|---|
| 1 | **Supabase** | Tabelas `vendas` e `adimplencia` sem índices | 🟡 Médio | Consultas de dashboard varrem tabelas inteiras |
| 2 | **n8n** | `AI Agent` com Gemini API | 🟡 Médio | Latência de 2-5s por requisição à API Gemini |
| 3 | **n8n** | Buffer via Code node (`this.helpers.httpRequest()`) | 🟢 Baixo | Requisição HTTP extra para Supabase REST API |
| 4 | **Frontend** | Dashboard consulta `/api/dashboard` sem cache | 🟡 Médio | Toda renderização faz chamada à API |
| 5 | **Frontend** | Chat salva mensagem no Supabase + envia webhook | 🟢 Baixo | Duas operações por mensagem |
| 6 | **n8n** | SQLite como banco de dados | 🟡 Médio | Sem concorrência, gargalo em múltiplas execuções |
| 7 | **n8n** | Simple Memory (buffer window) | 🟢 Baixo | Memória em RAM, sem impacto relevante |
| 8 | **Supabase** | Migration 00003 não aplicada | 🔴 **Alto** | Tabelas de buffer não existem, n8n não consegue persistir |

### Consultas Potencialmente Lentas

| Query | Local | Problema |
|---|---|---|
| `SELECT * FROM vendas` | `/api/dashboard/route.ts` | Sem filtro, sem paginação, tabela pode crescer |
| `SELECT * FROM adimplencia` | `/api/dashboard/route.ts` | Sem filtro, sem paginação |
| `admin.auth.admin.listUsers()` | `/api/me/route.ts`, `/api/create-user/route.ts`, `/api/profile/route.ts` | Lista todos os usuários do Auth — escala mal |

### Loops

| # | Local | Descrição | Risco |
|---|---|---|---|
| 1 | `/api/sync-funcionarios` | Loop `for (const f of funcionarios)` com `listUsers()` dentro do loop | 🔴 **Alto** — `O(n²)` com chamada à API Auth para cada funcionário. Com 200+ funcionários, timeout garantido |

### HTTP Requests

| # | Origem | Destino | Frequência | Impacto |
|---|---|---|---|---|
| 1 | ChatInterfaceV2 | n8n webhook (ngrok) | Por mensagem do usuário | 🟡 Médio — ngrok adiciona latência |
| 2 | n8n Code node | Supabase REST API | Por mensagem (buffer) | 🟢 Baixo |
| 3 | n8n AI Agent | Google Gemini API | Por mensagem | 🟡 Médio — 2-5s latência |
| 4 | Dashboard page | `/api/dashboard` | Por carregamento | 🟡 Médio |
| 5 | Frontend | Supabase Auth | Por requisição | 🟢 Baixo |

---

## 16. Escalabilidade

### 20 usuários simultâneos
| Componente | Status | Observação |
|---|---|---|
| Frontend (Next.js) | ✅ OK | Sem problemas |
| Supabase (Free Tier) | ✅ OK | Tabelas pequenas, sem contenção |
| n8n (SQLite) | ✅ OK | Execuções sequenciais suficientes |
| WAHA | ✅ OK | Sessão única |
| **Nota:** | ✅ **Operacional** | Sem alterações necessárias |

### 50 usuários simultâneos
| Componente | Status | Observação |
|---|---|---|
| Frontend (Next.js) | ✅ OK | Escala horizontalmente |
| Supabase | ⚠️ **Atenção** | `funcionarios`/`vendas`/`adimplencia` sem índices podem ficar lentos |
| n8n (SQLite) | ⚠️ **Gargalo** | SQLite não suporta escrita concorrente |
| AI Agent (Gemini Free) | ❌ **429 Rate Limit** | Gemini free tier tem rate limit restrito |
| **Nota:** | ⚠️ **Limitado** | SQLite + Gemini free tier são gargalos |

### 100 usuários simultâneos
| Componente | Status | Observação |
|---|---|---|
| Frontend | ✅ OK | Next.js escala bem com CDN/ISR |
| Supabase | ❌ **Necessário upgrade** | Plano Pro necessário |
| n8n (SQLite) | ❌ **Bloqueante** | **Necessário migrar para PostgreSQL** |
| n8n workers | ❌ **Necessário** | Múltiplos workers para paralelismo |
| WAHA | ⚠️ **Atenção** | Múltiplas sessões WAHA podem ser necessárias |
| Dashboard API | ❌ **Gargalo** | `listUsers()` + `SELECT *` sem paginação quebram |
| **Nota:** | ❌ **Requer arquitetura** | Migração de SQLite para PostgreSQL é obrigatória |

### 300 usuários simultâneos
| Componente | Status | Observação |
|---|---|---|
| Frontend | ⚠️ **Escalável** | Requer CDN + otimizações de build |
| Supabase | ❌ **Problemas** | Plano Team/Enterprise + tuning |
| n8n (SQLite) | ❌ **Impossível** | **SQLite não escala para 300 usuários** |
| PostgreSQL | ❌ **Obrigatório** | Migração obrigatória |
| n8n runners | ❌ **Obrigatório** | Paralelismo essencial |
| Cache | ❌ **Obrigatório** | Redis ou similar para cache |
| **Nota:** | ❌ **Requer redesign** | Arquitetura atual não suporta 300 usuários |

### Gargalos Identificados para Escalabilidade

| # | Gargalo | Impacto | Solução |
|---|---|---|---|
| 1 | n8n com SQLite | 🔴 Bloqueante para >50 usuários | Migrar para PostgreSQL |
| 2 | Gemini API free tier (rate limit) | 🟡 Médio | Upgrade para plano pago ou alternar para OpenAI |
| 3 | Supabase free tier | 🟡 Médio | Upgrade para plano Pro |
| 4 | Dashboard sem paginação | 🟡 Médio | Adicionar paginação/limites |
| 5 | `admin.listUsers()` em loops | 🔴 Bloqueante para >100 usuários | Cachear listagem de usuários |
| 6 | ngrok como webhook público | 🟡 Médio | URL fixa com domínio próprio |
| 7 | WAHA sessão única | 🟡 Médio | Múltiplas sessões para múltiplos números |

---

## 17. Pendências

Lista completa ordenada por prioridade:

| # | Prioridade | Item | Domínio | Esforço | Depende de |
|---|---|---|---|---|---|
| 1 | 🔴 **Crítica** | Aplicar Migration 00003 no Supabase SQL Editor | Banco | 5min | Nenhuma |
| 2 | 🔴 **Crítica** | Configurar OCR.space API Key | n8n/OCR | 15min | Conta OCR.space |
| 3 | 🔴 **Crítica** | Configurar Google Calendar OAuth redirect URI | Google | 1h | Console Google Cloud |
| 4 | 🔴 **Crítica** | Exportar workflows n8n como backup JSON | n8n | 30min | Nenhuma |
| 5 | 🔴 **Crítica** | Resolver webhookId null no CRM Chat workflow | n8n | 2h | Backup dos workflows |
| 6 | 🔴 **Crítica** | Criar webhook `/webhook/waha` no n8n | n8n | 1h | Nenhuma |
| 7 | 🔴 **Alta** | Implementar Master Router com Switch node | n8n | 3h | Migration 00003 aplicada |
| 8 | 🔴 **Alta** | Criar Agente Conciliação workflow | n8n | 4h | Migration 00003 aplicada |
| 9 | 🔴 **Alta** | Corrigir Agente OCR workflow | n8n | 2h | OCR.space API Key |
| 10 | 🔴 **Alta** | Mover N8N_ENCRYPTION_KEY para .env ou Docker secrets | Docker/Sec | 30min | Nenhuma |
| 11 | 🟡 **Média** | Adicionar RLS nas tabelas funcionarios, vendas, adimplencia | Banco | 1h | Nenhuma |
| 12 | 🟡 **Média** | Adicionar healthcheck nos containers Docker | Docker | 1h | Nenhuma |
| 13 | 🟡 **Média** | Configurar auto-toggle do webhook no startup do n8n | n8n | 2h | Nenhuma |
| 14 | 🟡 **Média** | Implementar Views SQL para dashboard | Banco | 2h | Nenhuma |
| 15 | 🟡 **Média** | Adicionar paginação nas queries do dashboard | API | 2h | Nenhuma |
| 16 | 🟡 **Média** | Criar testes E2E para chat, dashboard, admin | Tests | 2d | Nenhuma |
| 17 | 🟡 **Média** | Configurar Google Drive OAuth + Storage buckets | Google/n8n | 2h | Conta Google |
| 18 | 🟢 **Baixa** | Mover scripts de debug para pasta `scripts/` | Organização | 30min | Nenhuma |
| 19 | 🟢 **Baixa** | Adicionar ngrok.exe ao .gitignore | Git | 1min | Nenhuma |
| 20 | 🟢 **Baixa** | Remover código v1 (dashboard.tsx, chat-interface.tsx) | Frontend | 1h | Autorização |
| 21 | 🟢 **Baixa** | Criar custom hooks em `src/hooks/` | Frontend | 2h | Nenhuma |
| 22 | 🟢 **Baixa** | Limpar variáveis de ambiente não utilizadas | Config | 30min | Nenhuma |
| 23 | 🟢 **Baixa** | Avaliar remoção do workflow Agente_Agendamento inativo | n8n | 30min | Backup |

---

## 18. Próximos Sprints

Sugestão de sequência lógica baseada em dependências e prioridades:

### Sprint 0 — Pré-requisitos (Manual)
| Tarefa | Esforço |
|---|---|
| Aplicar Migration 00003 no Supabase SQL Editor | 5min |
| Configurar OCR.space API Key | 15min |
| Registrar Google Calendar OAuth redirect URI | 1h |
| Exportar todos workflows n8n como JSON | 30min |
| Configurar Google Drive OAuth | 1h |
| Mover `N8N_ENCRYPTION_KEY` para `.env` | 15min |

### Sprint 1 — Master Router + Buffer
| Tarefa | Esforço | Depende |
|---|---|---|
| Implementar Switch node por tipo de arquivo no CRM Chat | 3h | Migration 00003 |
| Corrigir webhookId persistence | 2h | — |
| Implementar webhook toggle automático no startup | 2h | — |

### Sprint 2 — Agente OCR (Comprovante)
| Tarefa | Esforço | Depende |
|---|---|---|
| Corrigir OCR.space HTTP Request node | 2h | OCR.space API Key |
| Implementar validação de resposta OCR | 1h | — |
| Implementar salvamento em `comprovantes` | 1h | Migration 00003 |
| Integrar Google Drive para armazenamento | 2h | Google Drive OAuth |

### Sprint 3 — Agente Conciliação (CTN + Extrato)
| Tarefa | Esforço | Depende |
|---|---|---|
| Criar workflow de conciliação | 4h | Migration 00003 |
| Fluxo de leitura de CTN | 1h | — |
| Fluxo de leitura de extrato bancário | 1h | — |
| Cruzamento e divergências | 2h | — |

### Sprint 4 — WAHA + Telegram
| Tarefa | Esforço | Depende |
|---|---|---|
| Criar webhook `/webhook/waha` no n8n | 1h | — |
| Integrar WAHA com Master Router | 2h | Sprint 1 |
| Reativar/integrar Telegram | 1h | — |

### Sprint 5 — Healthcheck + Estabilidade
| Tarefa | Esforço | Depende |
|---|---|---|
| Adicionar healthcheck Docker | 1h | — |
| Implementar auto-toggle webhook no startup | 2h | — |
| Remover hardcoded credentials (Docker secrets) | 2h | — |
| Corrigir HTTP Request node bug (se corrigido upstream) | 1h | — |

### Sprint 6 — Testes
| Tarefa | Esforço | Depende |
|---|---|---|
| E2E tests: Chat (texto + arquivo) | 4h | — |
| E2E tests: Dashboard | 2h | — |
| E2E tests: Admin (agentes config) | 2h | — |
| E2E tests: Login (fluxo completo) | 2h | — |

### Sprint 7 — Google Drive + Storage
| Tarefa | Esforço | Depende |
|---|---|---|
| Configurar buckets no Supabase Storage | 1h | — |
| Integrar Google Drive para backup de comprovantes | 2h | Google Drive OAuth |
| Implementar upload/download de arquivos | 2h | — |

### Sprint 8 — Agenda Independente + Melhorias
| Tarefa | Esforço | Depende |
|---|---|---|
| Workflow de agenda independente | 3h | Google Calendar OAuth |
| Melhorias no dashboard (Views SQL, filtros, período) | 4h | — |
| Refatorar chat-interface-v2.tsx (componentização) | 4h | — |

### Sprint 9 — Power BI / Relatórios Avançados
| Tarefa | Esforço | Depende |
|---|---|---|
| Integração Power BI | 4h | — |
| Views SQL para métricas | 2h | — |
| Exportação de dados | 2h | — |

### Sprint 10 — Limpeza Final
| Tarefa | Esforço | Depende |
|---|---|---|
| Mover scripts de debug para pasta dedicada | 30min | — |
| Limpar código v1 (dashboard.tsx, chat-interface.tsx) | 1h | — |
| Documentação final | 2h | — |
| Backup versionado de workflows | 30min | — |

---

## 19. Git

### Últimos Commits (14 commits)

| Commit | Data | Descrição |
|---|---|---|
| `19be13a` | 2026-07-21 10:32 | feat: profile page with avatar, name, email, cargo |
| `a335c8f` | 2026-07-21 10:27 | fix: conditional admin sidebar + chat badge dismiss on visit |
| `b13f4a4` | 2026-07-21 10:20 | fix: update Kevin metadata and fix cargo fallback in dashboard |
| `bb4f250` | 2026-07-21 10:18 | fix: get cargo from client-side Supabase or /api/me?userId= fallback |
| `e7dc928` | 2026-07-21 10:13 | fix: dashboard auth - use admin client and client-side cargo filtering |
| `d4e5544` | 2026-07-21 10:08 | feat: display full name and cargo in sidebar |
| `c306066` | 2026-07-21 10:00 | fix: replace getUserByEmail with listUsers filter |
| `fbc43fc` | 2026-07-21 10:00 | feat: add admin page and user creation |
| `5c653b5` | 2026-07-21 09:56 | feat: role-based access from funcionarios table |
| `03df8fb` | 2026-07-21 09:43 | feat: add register toggle to Klaws-themed login |
| `9e30031` | 2026-07-21 09:41 | feat: restyle login page with Klaws dark theme |
| `b6da610` | 2026-07-21 09:36 | chore: rebrand Nexus to Klaws |
| `532076f` | 2026-07-21 09:16 | feat: promote CRM v2 (Nexus) to main /crm route |
| `6fda890` | 2026-07-21 09:15 | feat: initial backup - CRM v1 + v2 with n8n and Waha WhatsApp integration |

### Arquivos Modificados (últimos 5 commits)

```
crm/src/app/api/dashboard/route.ts      | 106 ++++++++-----------
crm/src/app/api/me/route.ts             |  65 +++++++++---
crm/src/app/api/profile/route.ts        |  43 ++++++++
crm/src/app/api/upload-avatar/route.ts  |  47 +++++++++
crm/src/app/crm/perfil/page.tsx         | 182 +++++++++++++++++++++++++++++++++
crm/src/components/crm-sidebar.tsx      |  78 ++++++++++----
crm/src/components/dashboard-v2.tsx     |  68 +++++++-----
 7 files changed, 462 insertions(+), 127 deletions(-)
```

### Resumo do git diff (HEAD~5..HEAD)

- **7 arquivos modificados** (462 inserções, 127 deleções)
- **3 novos arquivos:** `profile/route.ts`, `upload-avatar/route.ts`, `crm/perfil/page.tsx`
- **4 arquivos alterados:** `dashboard/route.ts`, `me/route.ts`, `crm-sidebar.tsx`, `dashboard-v2.tsx`
- Foco: página de perfil com upload de avatar + sidebar com badge de chat + melhorias de dashboard

### Working tree (não commitado)

- **Modificados:** `crm/src/components/chat-interface-v2.tsx`, `crm/src/components/crm-sidebar.tsx`, `docker-compose.yml`, `n8n/data/database.sqlite`, arquivos WAHA SQLite
- **Não versionados:** `.ai/` completo, 75+ scripts, `API.md`, `ARCHITECTURE_REVIEW.md`, `DEPENDENCIES.md`, `ENVIRONMENT.md`, `RISKS.md`, `STATUS.md`, `TESTS.md`, `TODO_NEXT.md`, `TREE.md`

---

## 20. Conclusão

### Resumo Técnico

O KLAWS CRM é uma plataforma de automação operacional em estágio inicial de desenvolvimento. O frontend Next.js está funcional com autenticação, dashboard, chat com IA (Gemini), perfil e admin. O backend é composto por API Routes Next.js + Supabase + n8n.

**O que funciona:**
- Autenticação Supabase SSR (login/registro)
- Dashboard com rankings de vendas e adimplência
- Chat com IA via n8n (Gemini) — texto apenas
- Página de perfil com avatar
- Admin: criação de usuários, sync de funcionários, configuração de agentes
- Docker compose com 3 containers

**O que está parcialmente funcional:**
- n8n CRM Chat (funciona mas webhook não persiste após restart)
- Google Calendar (OAuth configurado mas redirect URI não registrado)

**O que não funciona ou não existe:**
- OCR (API key não configurada, workflow 100% falhando)
- Conciliação (workflow não existe)
- WAHA webhook (não registrado no n8n)
- Google Drive (não configurado)
- Master Router (sem Switch node, fluxo linear)
- Migration 00003 não aplicada (3 tabelas não existem)
- Telegram (workflow inativo)

### Estado Geral do Projeto

| Aspecto | Status | Score |
|---|---|---|
| Frontend | ✅ Funcional (maduro) | 85% |
| API Routes | ✅ Funcionais | 80% |
| Supabase (Auth + DB) | ⚠️ Parcial (migration pendente) | 60% |
| n8n Workflows | ⚠️ Parcial (bugs + faltantes) | 35% |
| WAHA | ⚠️ Container rodando, webhook ausente | 30% |
| Google Calendar | ❌ OAuth incompleto | 20% |
| Google Drive | ❌ Não configurado | 0% |
| OCR | ❌ Não funcional | 10% |
| Conciliação | ❌ Não implementado | 0% |
| Testes | ❌ Cobertura mínima | 10% |
| Segurança | ⚠️ Múltiplas falhas | 40% |
| Docker | ✅ Funcional (sem healthcheck) | 70% |
| **Geral** | **Em desenvolvimento ativo** | **45/100** |

### Nota de Maturidade (0–10)

**4.5 / 10**

O projeto tem boa base frontend e arquitetura documentada, mas sofre de múltiplas pendências críticas que impedem o funcionamento completo:
- Migration de banco não aplicada
- Integrações externas não configuradas (OCR.space, Google Calendar OAuth)
- Workflows n8n sem backup e com bugs de persistência
- Falhas graves de segurança (encryption key versionada, service role exposta)
- 3 tabelas sem RLS expondo dados sensíveis
- Sem testes significativos

### Risco Atual

**🔴 ALTO**

| Risco | Probabilidade | Impacto |
|---|---|---|
| Perda de workflows n8n (sem backup) | Alta | Perda total de automações |
| Exposição de dados (Service Role + N8N_KEY versionados) | Média | Comprometimento total do sistema |
| Interrupção do serviço de chat (webhook não persiste) | Alta | Chat indisponível após restart |
| Falha do OCR (API key não configurada) | Certa | OCR 100% não funcional |
| Falha do Google Calendar (OAuth não registrado) | Certa | Agenda não funcional |

### Recomendação

**CONTINUAR — com ressalvas urgentes**

O projeto tem mérito técnico e arquitetura bem planejada. As integrações são complexas mas viáveis. No entanto, recomenda-se:

1. **Antes de qualquer novo desenvolvimento:** Aplicar Migration 00003 + configurar OCR.space + configurar Google OAuth + exportar backups dos workflows
2. **Corrigir falhas de segurança imediatamente:** Remover `N8N_ENCRYPTION_KEY` do docker-compose versionado, mover para .env, revisar scripts com chaves hardcoded
3. **Estabilizar antes de expandir:** Resolver webhook persistence, Switch node do Master Router, webhook WAHA
4. **Não escalar antes da base estar sólida:** SQLite do n8n não escala — PostgreSQL deve ser planejado para médio prazo

**O projeto pode atingir maturidade 7/10 em 3-4 sprints focados em estabilidade e segurança.**

---

PROJECT REVIEW GERADO COM SUCESSO
