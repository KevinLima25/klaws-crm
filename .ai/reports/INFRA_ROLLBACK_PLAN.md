# INFRA_ROLLBACK_PLAN — Plano de Rollback da Migração Docker

## Snapshot Pré-Migração

### Containers (registrados em 2026-07-23)

| Nome | Imagem | ID |
|------|--------|----|
| crm | klaws-crm:latest | `docker inspect crm` |
| n8n | n8nio/n8n:latest | `docker inspect n8n` |
| ocr-service | wahann-ocr-service:latest | `docker inspect ocr-service` |
| waha | devlikeapro/waha:latest | Exited (143) |

### Volumes

8 volumes anônimos (listados via `docker volume ls`). Volumes do CRM:
- `/app/node_modules` → hash `461571a5b9a2f3cc646759502283e4ea74d52842db6a6d612d61a1349f40ed15`
- `/app/.next` → hash `28befc0c9d3a4c74dc5e4e19c57e2e3ab1979efe3a5427d653a92e427f5c443e`

Demais volumes: órfãos de builds anteriores.

### Redes

- `wahann_automation` (bridge, 172.18.0.0/16) — n8n, ocr-service
- `klaws_automation` (bridge, 172.19.0.0/16) — crm

### Docker Compose Projects

- `wahann` → `C:\Users\User\Downloads\Waha N&N\docker-compose.yml`
- `klaws` → `C:\KLAWS\docker-compose.yml`

## Procedimento de Rollback

### Se a migração falhar antes de derrubar serviços antigos:

1. Parar containers novos (se criados):
   ```powershell
   cd C:\KLAWS\infrastructure
   docker compose down
   ```

2. Remover rede nova (se criada):
   ```powershell
   docker network rm klaws_infrastructure
   ```

3. Restaurar serviços antigos (se parados):
   ```powershell
   cd "C:\Users\User\Downloads\Waha N&N"
   docker compose up -d
   ```

### Se a migração falhar após derrubar serviços antigos:

1. Restaurar bind mounts do diretório antigo:
   ```powershell
   # n8n data
   docker run --rm -v n8n_data_backup:/backup -v C:\KLAWS\infrastructure\n8n\data:/data busybox cp -r /data/* /backup/
   # (substituir pelo método adequado de restore)
   ```

2. Recriar containers usando o Compose antigo:
   ```powershell
   cd "C:\Users\User\Downloads\Waha N&N"
   docker compose up -d
   ```

3. Verificar logs de cada serviço.

### Se houver perda de dados do n8n:

1. Importar workflow do backup JSON:
   - Acessar http://localhost:5678
   - Settings → Import Workflow
   - Selecionar arquivo de backup

2. Restaurar credenciais:
   - Reconfigurar manualmente no n8n UI
   - Ou restaurar `n8n\data\database.sqlite` do backup

### Se houver perda de sessão WAHA:

1. Restaurar diretório de sessões:
   ```powershell
   Copy-Item -Recurse "C:\KLAWS\infrastructure\waha\sessions_backup\*" "C:\KLAWS\infrastructure\waha\sessions\"
   ```
2. Reiniciar WAHA:
   ```powershell
   docker compose restart waha
   ```

## Arquivos Originais Preservados

Até aprovação do Review Gate (INFRA 3.4), o diretório original NÃO será removido:
`C:\Users\User\Downloads\Waha N&N\`

## Contatos

- Rollback autorizado por: [usuário]
- Rollback executado em: [data/hora]
- Rollback verificado por: [usuário]
