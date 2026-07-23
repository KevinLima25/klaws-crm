# KLAWS CRM — Desenvolvimento Local

## Pré-requisitos

- Node.js 20+ (recomendado: 22+)
- Docker Desktop
- Git

## Infraestrutura Docker

Todo o ambiente local roda via Docker Compose, unificado em:

```
C:\KLAWS\infrastructure\docker-compose.yml
```

### Portas oficiais

| Serviço | URL | Porta Host |
|---------|-----|------------|
| CRM | http://localhost:3001 | 3001 |
| n8n | http://localhost:5678 | 5678 |
| OCR Service | http://localhost:3002/health | 3002 |
| WAHA | http://localhost:3000 (sob demanda) | 3000 |

### Iniciar ambiente

```powershell
cd C:\KLAWS\infrastructure
docker compose up -d
```

### Atualizar após alterações no código CRM

```powershell
cd C:\KLAWS\infrastructure
docker compose build --no-cache crm
docker compose up -d --force-recreate crm
```

### Verificar saúde

```powershell
docker ps --filter "network=klaws_infra"
```

## Desenvolvimento sem Docker (npm run dev)

**Não recomendado.** O ambiente oficial é via Docker na porta 3001.
Caso necessário executar localmente:

```powershell
cd C:\KLAWS\crm
$env:NEXT_TELEMETRY_DISABLED="1"
npm run dev
```
O servidor estará em http://localhost:3000.

## Variáveis de Ambiente

### CRM (`crm/.env.local`)
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/crm-chat
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```

### Docker (`infrastructure/.env`)
Template disponível em `C:\KLAWS\infrastructure\.env.example`.
Variáveis sensíveis devem ser definidas neste arquivo (não versionado).

## Comunicação entre Serviços

- CRM → n8n: `http://localhost:5678/webhook/crm-chat` (via host port)
- WAHA → n8n: `http://host.docker.internal:5678/webhook/waha`
- n8n externo: `https://thread-urologist-catching.ngrok-free.dev/` (ngrok)

## Rollback

Ver `.ai/reports/INFRA_ROLLBACK_PLAN.md`.
