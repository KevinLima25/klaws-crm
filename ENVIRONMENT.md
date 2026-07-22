# ENVIRONMENT — Relatório de Variáveis

## Variáveis Adicionadas

### Frontend (`crm/.env.local`)
| Variável | Valor | Onde é usada |
|---|---|---|
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | `http://localhost:5678/webhook/crm-chat` | `chat-interface-v2.tsx` — envio de mensagens para o n8n |

(Nota: o arquivo já existia, mas o valor foi alterado — ver abaixo)

## Variáveis Alteradas

### Frontend (`crm/.env.local`)
| Variável | Antes | Depois |
|---|---|---|
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | `http://localhost:5678/webhook/crm-chat-v2` | `http://localhost:5678/webhook/crm-chat` |

### Docker (`docker-compose.yml` — serviço n8n)
| Variável | Antes | Depois | Motivo |
|---|---|---|---|
| `WEBHOOK_URL` | `https://thread-urologist-catching.ngrok-free.dev/` | *(removida)* | Depreciada no n8n 2.30.7 |
| `N8N_WEBHOOK_URL` | *(não existia)* | `http://localhost:5678/` | Substitui `WEBHOOK_URL` — formato correto para n8n 2.x |

## Variáveis Mantidas (inalteradas)

### Frontend (`crm/.env.local`)
| Variável | Valor | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wbmljquydsatacqerlzv.supabase.co` | Cliente Supabase (browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_NFhQ2UKHZVJs3v2X1PlPkA__ToSrrro` | Cliente Supabase (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY_REMOVED` | Admin client (server-side) |

### Docker (`docker-compose.yml`)
| Variável | Valor |
|---|---|
| `N8N_HOST` | `localhost` |
| `N8N_PORT` | `5678` |
| `N8N_PROTOCOL` | `http` |
| `N8N_PROXY_HOPS` | `1` |
| `N8N_ENCRYPTION_KEY` | `N8N_ENCRYPTION_KEY_REMOVED` |
| `N8N_RUNNERS_ENABLED` | `true` |
| `GENERIC_TIMEZONE` | `America/Sao_Paulo` |
| `TZ` | `America/Sao_Paulo` |

## Necessário Alterar Vercel?
**Não.** O CRM roda localmente em Docker (`crm` service na porta 3001). Não há deploy na Vercel atualmente.

## Necessário Alterar Docker?
**Já alterado.** `docker-compose.yml` foi modificado (`WEBHOOK_URL` → `N8N_WEBHOOK_URL`). Após aplicar, execute:
```powershell
docker compose -f docker-compose.yml up -d
```

## Necessário Alterar Supabase?
**Sim.** A migration `00003_add_comprovantes_agentes_config.sql` precisa ser aplicada manualmente no SQL Editor do Supabase (https://supabase.com) para criar as tabelas:
- `comprovantes`
- `agentes_config`
- `message_buffer`

Após aplicar, o n8n poderá usar o Service Role Key para acessar essas tabelas via HTTP Request / Code node.
