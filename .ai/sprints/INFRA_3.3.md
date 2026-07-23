# SPRINT INFRA 3.3 — MIGRAÇÃO CONTROLADA DA INFRAESTRUTURA DOCKER

## Objetivo

Migrar a infraestrutura Docker do diretório legado `C:\Users\User\Downloads\Waha N&N` para o diretório canônico `C:\KLAWS\infrastructure`, unificando os dois projetos Compose (`wahann` e `klaws`) em um único ponto de controle.

## Escopo

- n8n
- ocr-service
- WAHA
- CRM (bind mount já em C:\KLAWS\crm, apenas referencial)
- Arquivos Compose, Dockerfiles, configurações, scripts
- Rede unificada entre serviços

## Fora de escopo

- Alterações no banco Supabase
- Criação de funcionalidades novas
- Alteração de regras de negócio
- UX 4.x
- WhatsApp / WAHA (não iniciar sem autorização)

## Etapas

### ETAPA 1 — Inventário

- [x] Listar todos os arquivos docker-compose
- [x] Identificar projetos, serviços, imagens, portas, redes, volumes
- [x] Mapear bind mounts e caminhos absolutos
- [x] Identificar URLs de comunicação entre serviços
- [x] Identificar caminhos que ainda apontam para Downloads
- [ ] Salvar inventário em `.ai/reports/INFRA_PRE_MIGRATION.md`

### ETAPA 2 — Backup e Rollback

- [ ] Exportar workflows do n8n
- [ ] Registrar docker inspect de todos os containers
- [ ] Registrar volumes, redes, imagens
- [ ] Copiar arquivos Compose e Dockerfiles
- [ ] Preservar configurações e sessões WAHA
- [ ] Preservar dados persistentes do n8n
- [ ] Criar plano de rollback em `.ai/reports/INFRA_ROLLBACK_PLAN.md`

### ETAPA 3 — Nova Estrutura

- [ ] Criar `C:\KLAWS\infrastructure\`
- [ ] Organizar subdiretórios: n8n, ocr-service, waha, scripts
- [ ] Criar `docker-compose.yml` unificado
- [ ] Atualizar `.gitignore`
- [ ] Manter dados persistentes fora do versionamento

### ETAPA 4 — Redes e Comunicação

- [ ] Auditar comunicação entre serviços
- [ ] Avaliar rede Docker externa compartilhada
- [ ] Criar ADR se necessário (.ai/review/ADR_DOCKER_NETWORK.md)

### ETAPA 5 — Migração

Ordem:
1. ocr-service
2. n8n
3. WAHA
4. Validação de integração
5. CRM (somente se necessário)

- [ ] Migrar arquivos sem derrubar serviços atuais
- [ ] Validar novo Compose com `docker compose config`
- [ ] Migrar um serviço por vez
- [ ] Preservar volumes, portas e dados
- [ ] Testar cada serviço antes de avançar
- [ ] Manter rollback disponível

### ETAPA 6 — Validação Funcional

- [ ] CRM: http://localhost:3001/login
- [ ] CRM: http://localhost:3001/crm
- [ ] n8n: http://localhost:5678
- [ ] OCR: http://localhost:3002/health
- [ ] WAHA: somente quando autorizado
- [ ] n8n workflows e credenciais preservados

## Critérios de aceite

- [ ] Nenhum serviço depende de `C:\Users\User\Downloads\Waha N&N`
- [ ] Todos os serviços rodam a partir de `C:\KLAWS\infrastructure`
- [ ] Portas inalteradas (3001 CRM, 5678 n8n, 3002 OCR, 3000 WAHA)
- [ ] Dados preservados (n8n SQLite, sessões WAHA)
- [ ] Rede única permite comunicação entre serviços
- [ ] Rollback funcional documentado

## Bloqueadores

- Ausência de backup dos workflows n8n
- Perda de dados de sessão WAHA
- Quebra de comunicação CRM → n8n
