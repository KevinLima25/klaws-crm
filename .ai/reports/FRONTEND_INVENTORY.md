# KLAWS CRM — FRONTEND INVENTORY (Next.js 16 + React 19)

**Data da Auditoria:** 2026-07-21
**Stack:** Next.js 16.2.10 (App Router), React 19.2.4, TypeScript 5, Tailwind CSS 4, Shadcn/UI, Supabase SSR

---

## ESTRUTURA DE PASTAS (`crm/src`)

```
src/
├── app/                    # App Router (Next.js 16)
│   ├── page.tsx           # Redirect → /login
│   ├── layout.tsx         # Root layout + providers
│   ├── globals.css        # Tailwind + variáveis CSS
│   ├── login/page.tsx     # Login page (AuthForm)
│   ├── auth/callback/route.ts  # OAuth callback
│   ├── api/               # Server Routes (API Routes)
│   │   ├── dashboard/route.ts
│   │   ├── agentes-config/route.ts
│   │   ├── create-user/route.ts
│   │   ├── profile/route.ts
│   │   ├── me/route.ts
│   │   ├── upload-avatar/route.ts
│   │   └── sync-funcionarios/route.ts
│   └── crm/               # Área logada (protected by middleware)
│       ├── layout.tsx     # Sidebar + header
│       ├── page.tsx       # DashboardV2
│       ├── chat/page.tsx  # ChatInterfaceV2
│       └── perfil/page.tsx
├── components/
│   ├── ui/                # Shadcn/UI components (10)
│   ├── chat-interface.tsx     # v1 (370 linhas) — NÃO USADO
│   ├── chat-interface-v2.tsx  # v2 (374 linhas) — **ATIVO**
│   ├── dashboard.tsx          # v1 — NÃO USADO
│   ├── dashboard-v2.tsx       # v2 (341 linhas) — **ATIVO**
│   ├── crm-sidebar.tsx        # Navegação lateral
│   ├── auth-form.tsx          # Form login/register
│   └── admin/agentes/page.tsx # Admin agentes config
├── hooks/                 # Vazio (TODO #10: extrair useChat, useFileUpload)
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # createBrowserClient
│   │   ├── server.ts      # createServerClient
│   │   ├── middleware.ts  # updateSession (auth refresh)
│   │   └── admin.ts       # createAdminClient (service role)
│   ├── utils.ts           # cn() helper
│   └── roles.ts           # canSeeVendas, canSeeAdimplencia
└── proxy.ts               # Proxy para n8n webhook (dev)
```

---

## PÁGINAS

| Rota | Componente | Descrição | Auth |
|------|------------|-----------|------|
| `/` | `page.tsx` | Redirect → /login | ❌ |
| `/login` | `login/page.tsx` | AuthForm (login/register) | ❌ |
| `/auth/callback` | `auth/callback/route.ts` | OAuth callback (Supabase) | ❌ |
| `/crm` | `crm/page.tsx` | **DashboardV2** (vendas + adimplência) | ✅ |
| `/crm/chat` | `crm/chat/page.tsx` | **ChatInterfaceV2** (webhook n8n) | ✅ |
| `/crm/perfil` | `crm/perfil/page.tsx` | Perfil usuário (avatar, nome, cargo) | ✅ |
| `/admin` | `admin/page.tsx` | Admin: sync funcionários, create user | ✅ (admin) |
| `/admin/agentes` | `admin/agentes/page.tsx` | Config agentes por cargo (switches) | ✅ (admin) |

---

## COMPONENTES PRINCIPAIS

### ChatInterfaceV2 (`chat-interface-v2.tsx` — 374 linhas)
**Status:** **ATIVO** — usado em `/crm/chat`
**Funcionalidades:**
- Estado: messages[], input, loading, userId, userName, userCargo, activeTab, selectedFiles[]
- Tabs: Todas / Não respondidas / Agendamentos (UI only — sem backend)
- Upload: até 5 arquivos (PDF, JPG, PNG, XLS, XLSX, CSV)
- Envio: FormData → `NEXT_PUBLIC_N8N_WEBHOOK_URL` (`http://localhost:5678/webhook/crm-chat`)
- Persistência: `chat_messages` via Supabase client (user + bot)
- Resposta esperada: JSON `{ text: "..." }` ou array `[{ text: "..." }]`
- Fallback erro: mensagem padrão "Desculpe, estou tendo dificuldades..."

**Problemas conhecidos (TODO #10):**
- 374 linhas em componente único
- Lógica misturada: API calls + estado + UI + file handling
- Hooks `useChat`, `useFileUpload` não extraídos

### DashboardV2 (`dashboard-v2.tsx` — 341 linhas)
**Status:** **ATIVO** — usado em `/crm`
**Funcionalidades:**
- Busca `/api/dashboard` + `/api/me` (cargo do usuário)
- Permissões por cargo: `canSeeVendas`, `canSeeAdimplencia`
- Abas: Ranking Vendas / Ranking Adimplência
- Top 3 cards destacados + tabela paginada
- Cards de resumo: Total Vendas, Homologados, Adimplência (R$)

### CrmSidebar (`crm-sidebar.tsx`)
**Status:** **ATIVO** — layout `/crm/layout.tsx`
**Navegação:** Dashboard, Chat, Perfil, Admin (condicional)

### AdminAgentesPage (`admin/agentes/page.tsx` — 177 linhas)
**Status:** **ATIVO** — `/admin/agentes`
**Funcionalidades:**
- Fetch `/api/agentes-config` → `agentes_config` table
- Grid: cargos (linhas) × agentes [comprovante, conciliacao, atendimento] (colunas)
- Switches por cargo/agente → PUT `/api/agentes-config`
- Acesso restrito: cargo = ASSISTENTE FINANCEIRO ou GERENTE

---

## COMPONENTES UI (Shadcn/UI — 10)
| Componente | Arquivo |
|------------|---------|
| Button | `ui/button.tsx` |
| Input | `ui/input.tsx` |
| Card | `ui/card.tsx` |
| Avatar | `ui/avatar.tsx` |
| Badge | `ui/badge.tsx` |
| Label | `ui/label.tsx` |
| ScrollArea | `ui/scroll-area.tsx` |
| Separator | `ui/separator.tsx` |
| Switch | `ui/switch.tsx` |
| Table | `ui/table.tsx` |

---

## HOOKS
**Pasta `src/hooks/` existe mas está VAZIA.**
**TODO #10:** Extrair `useChat` e `useFileUpload` de `chat-interface-v2.tsx`

---

## API ROUTES (Server Routes)

| Rota | Método | Descrição | Auth |
|------|--------|-----------|------|
| `/api/dashboard` | GET | Rankings vendas/adimplência + totais | ✅ (admin client) |
| `/api/agentes-config` | GET/PUT | CRUD `agentes_config` table | ✅ (admin client) |
| `/api/create-user` | POST | Cria usuário no Supabase Auth + profile | ✅ (admin client) |
| `/api/profile` | GET/PUT | Perfil do usuário logado | ✅ (client) |
| `/api/me` | GET | Retorna cargo do usuário (via userId) | ✅ (client) |
| `/api/upload-avatar` | POST | Upload avatar → Supabase Storage | ✅ (client) |
| `/api/sync-funcionarios` | POST | Sincroniza CSV/Excel → `funcionarios` table | ✅ (admin client) |

---

## MIDDLEWARE
**Arquivo:** `lib/supabase/middleware.ts`
**Função:** `updateSession` — renova token de sessão Supabase a cada request
**Aplicado em:** `middleware.ts` (root) — protege rotas `/crm/*`, `/admin/*`

---

## AUTENTICAÇÃO
- **Provider:** Supabase Auth (email/password)
- **Client-side:** `createBrowserClient` (lib/supabase/client.ts)
- **Server-side:** `createServerClient` (lib/supabase/server.ts)
- **Admin:** `createAdminClient` (service role key) — lib/supabase/admin.ts
- **Callback:** `/auth/callback/route.ts` — troca code por session

---

## VARIÁVEIS DE AMBIENTE (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/crm-chat
```
**Nota:** `.env.local` existe mas não versionado.

---

## CHECKLIST ESPECÍFICO (ETAPA 5)

| Item | Status | Observação |
|------|--------|------------|
| Chat | ✅ | ChatInterfaceV2 ativo em `/crm/chat` |
| Dashboard | ✅ | DashboardV2 ativo em `/crm` |
| Admin | ✅ | `/admin` + `/admin/agentes` |
| Agentes Config UI | ✅ | AdminAgentesPage com switches |
| Usuários | ✅ | Admin create-user, sync-funcionarios |
| Agenda | ❌ | **NÃO EXISTE** no frontend (apenas no n8n) |
| Perfil | ✅ | `/crm/perfil` — avatar, nome, cargo |

---

## RISCOS FRONTEND

| Risco | Impacto | Arquivo |
|-------|---------|---------|
| ChatInterfaceV2 monolítico (374 linhas) | Manutenibilidade baixa, testes difíceis | `chat-interface-v2.tsx` |
| Sem testes E2E chat (apenas login.spec.ts) | Regressões não detectadas | `tests/` |
| Credencial n8n webhook URL no client-side | Exposição de endpoint interno | `.env` + `chat-interface-v2.tsx:136` |
| Duplicação v1/v2 (chat-interface.tsx, dashboard.tsx) | Confusão, código morto | `components/` |
| Proxy `/api/proxy` não usado em produção | Apenas dev | `proxy.ts` |

---

**NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.**