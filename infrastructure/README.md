# KLAWS CRM — Infraestrutura Docker

Diretório canônico para toda a infraestrutura Docker do KLAWS CRM.

## Serviços

| Serviço | Porta | Imagem | Status |
|---------|-------|--------|--------|
| CRM | `3001` | `infrastructure-crm` | Build local (C:\KLAWS\crm\Dockerfile) |
| n8n | `5678` | `n8nio/n8n` | Oficial |
| OCR Service | `3002` | `infrastructure-ocr-service` | Build local (./ocr-service/Dockerfile) |
| WAHA | `3000` | `devlikeapro/waha` | Oficial (iniciar sob demanda) |

## URLs Oficiais

- **CRM local:** http://localhost:3001
- **n8n Editor:** http://localhost:5678
- **OCR Service:** http://localhost:3002/health
- **WAHA Dashboard:** http://localhost:3000/dashboard (quando ativo)

## Comandos

### Iniciar todos os serviços
```powershell
cd C:\KLAWS\infrastructure
docker compose up -d
```

### Iniciar serviço específico
```powershell
docker compose up -d n8n           # n8n
docker compose up -d ocr-service   # OCR
docker compose up -d waha          # WAHA (sob demanda)
docker compose up -d crm           # CRM
```

### Parar serviço
```powershell
docker compose stop <serviço>
```

### Reconstruir serviço
```powershell
docker compose build --no-cache <serviço>
docker compose up -d --force-recreate <serviço>
```

### Ver logs
```powershell
docker compose logs -f <serviço>
```

### Verificar saúde
```powershell
docker ps --filter "network=klaws_infra"
```

### Reconstruir apenas o CRM (após alterações no código)
```powershell
docker compose build --no-cache crm
docker compose up -d --force-recreate crm
```

### Reconstruir apenas o n8n
```powershell
docker compose build --no-cache n8n
docker compose up -d --force-recreate n8n
```

## Backup

### n8n workflows
Exportar manualmente via UI: http://localhost:5678 → Settings → Import/Export

### Banco n8n (SQLite)
```powershell
# Localização: C:\KLAWS\infrastructure\n8n\data\database.sqlite
# Backup manual:
Copy-Item "C:\KLAWS\infrastructure\n8n\data\database.sqlite" "C:\KLAWS\infrastructure\scripts\backups\database.sqlite.bak"
```

## Rollback

Ver `.ai/reports/INFRA_ROLLBACK_PLAN.md` para procedimento completo de rollback.

## Estrutura de Diretórios

```
C:\KLAWS\infrastructure\
├── docker-compose.yml       # Orquestração unificada
├── .env.example             # Template de variáveis de ambiente
├── .gitignore               # Dados persistentes ignorados
├── README.md                # Esta documentação
├── n8n\
│   ├── data/                # Banco SQLite, credenciais, workflows (ignorado)
│   ├── n8n-files/           # Arquivos do n8n (ignorado)
│   └── files/               # Arquivos compartilhados (ignorado)
├── ocr-service\
│   ├── Dockerfile           # Build do OCR
│   ├── package.json
│   └── server.js
├── waha\
│   ├── sessions/            # Sessões WhatsApp (ignorado)
│   └── media/               # Mídias WhatsApp (ignorado)
└── scripts\
    └── backups/             # Backups de workflows
```
