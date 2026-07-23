# INFRA_PRE_MIGRATION — Inventário Pré-Migração

## 1. Projetos Docker Compose

### Projeto: `wahann`
| Atributo | Valor |
|----------|-------|
| Arquivo | `C:\Users\User\Downloads\Waha N&N\docker-compose.yml` |
| Status | running(2) — n8n e ocr-service ativos; waha Exited; crm running (duplicado) |

### Projeto: `klaws`
| Atributo | Valor |
|----------|-------|
| Arquivo | `C:\KLAWS\docker-compose.yml` |
| Status | running(1) — apenas crm |

## 2. Serviços

### n8n
| Atributo | Valor |
|----------|-------|
| Container | `n8n` |
| Imagem | `n8nio/n8n:latest` (2.47GB) |
| Status | Up (about 1h) |
| Porta | `5678:5678` |
| Rede | `wahann_automation` (172.18.0.4/16) |
| Restart | unless-stopped |
| Bind mounts | `C:\Users\User\Downloads\Waha N&N\n8n\data` → `/home/node/.n8n` |
| | `C:\Users\User\Downloads\Waha N&N\n8n\n8n-files` → `/home/node/.n8n-files` |
| | `C:\Users\User\Downloads\Waha N&N\n8n\files` → `/files` |
| Env relevantes | `N8N_WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/` |
| | `N8N_HOST=localhost`, `N8N_PORT=5678` |

### ocr-service
| Atributo | Valor |
|----------|-------|
| Container | `ocr-service` |
| Imagem | `wahann-ocr-service:latest` (206MB, build local) |
| Status | Up (about 1h) |
| Porta | `3002:3002` |
| Rede | `wahann_automation` (172.18.0.2/16) |
| Restart | unless-stopped |
| Build | `./ocr-service/Dockerfile` |
| Dockerfile | `C:\Users\User\Downloads\Waha N&N\ocr-service\Dockerfile` |
| Volumes | Nenhum bind mount |

### WAHA
| Atributo | Valor |
|----------|-------|
| Container | `waha` |
| Imagem | `devlikeapro/waha:latest` (4.1GB) |
| Status | **Exited (143)** — 57min ago, stopped |
| Porta | `3000:3000` |
| Rede | `wahann_automation` |
| Restart | unless-stopped (mas Exited) |
| Bind mounts | `C:\Users\User\Downloads\Waha N&N\waha\sessions` → `/app/.sessions` |
| | `C:\Users\User\Downloads\Waha N&N\waha\media` → `/app/.media` |
| Env | `WHATSAPP_HOOK_URL=http://host.docker.internal:5678/webhook/waha` |

### CRM (no projeto wahann — duplicado)
| Atributo | Valor |
|----------|-------|
| Container | `crm` (sobrescrito pelo klaws) |
| Imagem | `wahann-crm:latest` (1.29GB) |
| Status | N/A — o container ativo é do projeto `klaws` |

### CRM (no projeto klaws — ativo)
| Atributo | Valor |
|----------|-------|
| Container | `crm` |
| Imagem | `klaws-crm:latest` (1.66GB) |
| Status | Up (14min) |
| Porta | `3001:3000` |
| Rede | `klaws_automation` (172.19.0.2/16) |
| Restart | unless-stopped |
| Bind mount | `C:\KLAWS\crm` → `/app` |
| Volumes | `/app/node_modules` (anon), `/app/.next` (anon) |
| Env | `PORT=3000` |

## 3. Redes

| Nome | Driver | Subnet | Containers |
|------|--------|--------|------------|
| `wahann_automation` | bridge | 172.18.0.0/16 | n8n (172.18.0.4), ocr-service (172.18.0.2) |
| `klaws_automation` | bridge | 172.19.0.0/16 | crm (172.19.0.2) |

**⚠️ As redes são SEPARADAS.** Containers não se resolvem por nome entre projetos.

## 4. Volumes

8 volumes anônimos (hashes SHA256). Nenhum volume nomeado.

Volume hash → destino:
- `461571a5...` → crm: `/app/node_modules`
- `28befc0c...` → crm: `/app/.next`
- Demais 6 volumes: anônimos, sem label, provavelmente órfãos ou de builds anteriores.

## 5. Imagens

| Repositório | Tag | Tamanho |
|-------------|-----|---------|
| `klaws-crm` | latest | 1.66 GB |
| `wahann-ocr-service` | latest | 206 MB |
| `wahann-crm` | latest | 1.29 GB |
| `n8nio/n8n` | latest | 2.47 GB |
| `devlikeapro/waha` | latest | 4.1 GB |

## 6. URLs de Comunicação

| De → Para | URL | Tipo |
|-----------|-----|------|
| CRM → n8n (webhook) | `http://localhost:5678/webhook/crm-chat` | Host port (localhost) |
| WAHA → n8n (webhook) | `http://host.docker.internal:5678/webhook/waha` | Docker host |
| n8n externo | `https://thread-urologist-catching.ngrok-free.dev/` | ngrok tunnel |
| OCR health | `http://localhost:3002/health` | Host port |
| WAHA dashboard | `http://localhost:3000/dashboard` | Host port |

## 7. Caminhos para Downloads\Waha N&N

| Caminho | Usado por |
|---------|-----------|
| `C:\Users\User\Downloads\Waha N&N\docker-compose.yml` | Projeto `wahann` |
| `C:\Users\User\Downloads\Waha N&N\n8n\data` | n8n bind mount |
| `C:\Users\User\Downloads\Waha N&N\n8n\n8n-files` | n8n bind mount |
| `C:\Users\User\Downloads\Waha N&N\n8n\files` | n8n bind mount |
| `C:\Users\User\Downloads\Waha N&N\waha\sessions` | WAHA bind mount |
| `C:\Users\User\Downloads\Waha N&N\waha\media` | WAHA bind mount |
| `C:\Users\User\Downloads\Waha N&N\ocr-service\` | ocr-service build context |
| `C:\Users\User\Downloads\Waha N&N\crm\` | CRM duplicado (não ativo) |
| `C:\Users\User\Downloads\Waha N&N\.ai\` | Documentação legada |

## 8. Arquivos Legados no Diretório Antigo

- `docker-compose.yml` (completo, com todos os 4 serviços)
- `ocr-service\Dockerfile`
- `crm\Dockerfile` (não ativo)
- Scripts: `sprint*.js`, `check_state.js`, `deploy_waha_final.js`, `fix_waha_webhook.js`, `create_waha_webhook.js`
- Docs: `README.md`, `API.md`, `ARCHITECTURE_REVIEW.md`, `CHANGELOG.md`, `DEPENDENCIES.md`, `ENVIRONMENT.md`, `RISKS.md`, `STATUS.md`, `TESTS.md`, `TREE.md`, `TODO_NEXT.md`
- `ngrok.exe` (32MB, legado)
- `backups/` (workflows JSON)
- `docs/`
- `node_modules/`
