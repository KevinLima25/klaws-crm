# API — Relatório de Alterações

## APIs Criadas

### `GET /api/agentes-config`
**Arquivo:** `crm/src/app/api/agentes-config/route.ts`

| Campo | Valor |
|---|---|
| Payload | N/A (GET) |
| Resposta | `{ "configs": AgentConfig[] }` |
| Status HTTP | `200` sucesso, `500` erro |
| Middleware | Nenhum (usa `createAdminClient()` do Supabase internamente) |

### `PUT /api/agentes-config`
**Arquivo:** `crm/src/app/api/agentes-config/route.ts`

| Campo | Valor |
|---|---|
| Payload | `{ "configs": [{ cargo, agente, enabled }] }` |
| Resposta | `{ "configs": AgentConfig[] }` ou `{ "error": "..." }` |
| Status HTTP | `200` sucesso, `400` se `configs` não for array, `500` erro |
| Middleware | Nenhum (validação inline: `Array.isArray(configs)`) |

### `PUT /api/me` (implícita — já existente)
Usada pelo frontend para obter cargo do usuário logado. Criada em sessão anterior.

## APIs Alteradas

### n8n Webhook (fluxo interno)
**Workflow:** `CRM Chat (Simplified Webhook)` → `WFCRM001chat01`

| Campo | Antes | Depois |
|---|---|---|
| Path | `/webhook/crm-chat-v2` | `/webhook/crm-chat` |
| Content-Type esperado | `application/json` | `multipart/form-data` |
| Campos esperados | `{ user_id, name, message, source }` | `{ user_id, name, cargo, message, source, files[] }` |
| Resposta | `{ "text": "..." }` | `{ "text": "..." }` (inalterado) |
| Nós | 14 (com Wait, IF, Switch) | 10 (simplificado: Webhook → Code → Set → AI Agent → Set) |
| HTTP Request node | Usado (POST Supabase) | Removido (substituído por Code node) |

### `POST /webhook/crm-chat` (n8n Webhook)
**Payload (FormData):**
```
user_id: string (UUID)
name: string
cargo: string
message: string
source: "web_crm" (fixo)
files: File[] (opcional, máx 5)
```

**Resposta (JSON):**
```json
{ "text": "resposta do assistente" }
```

**Status HTTP:** `200` sucesso, `404` se webhook não registrado (pós-restart)

### n8n API (toggle interno)
**Endpoint:** `POST /api/v1/workflows/:id/deactivate` e `POST /api/v1/workflows/:id/activate`
**Header:** `X-N8N-API-KEY`
**Body:** `{}` (obrigatório — mesmo vazio)
**Uso:** Re-registrar webhook após restart do container

## APIs Removidas
Nenhuma.

## Middlewares
Nenhum middleware novo foi adicionado. A proteção das rotas `/admin/agentes` e `/api/agentes-config` é feita por:
- **Client-side:** verificação de cargo (`ASSISTENTE FINANCEIRO` ou `GERENTE`) via `fetch("/api/me")`
- **Server-side (Supabase RLS):** as tabelas possuem RLS policies que restringem acesso com base em `auth.uid()` e cargo
