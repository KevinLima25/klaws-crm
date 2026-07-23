# SPRINT INFRA 3.4 — AUDITORIA E REVIEW GATE DA INFRAESTRUTURA

## Objetivo

Auditar toda a infraestrutura Docker migrada, garantir que não há resquícios do diretório legado, e liberar ou bloquear o início da Fase 4.

## Etapas

### 1. Pastas e Governança

- [ ] `C:\KLAWS` é a única raiz canônica
- [ ] Nenhum serviço depende de `Downloads\Waha N&N`
- [ ] Nenhum script aponta para a pasta antiga
- [ ] Comandos oficiais documentados
- [ ] Nenhum Compose duplicado em uso

### 2. Containers

- [ ] Nomes, imagens, tags, portas corretos
- [ ] Restart policies adequadas
- [ ] Healthchecks configurados
- [ ] Dependências entre serviços
- [ ] Limites de CPU/memória (se aplicável)
- [ ] Comportamento pós-reboot do Docker

### 3. Volumes

- [ ] Volumes persistentes identificados
- [ ] Nenhum volume órfão relevante
- [ ] Dados do n8n preservados
- [ ] Sessões WAHA preservadas
- [ ] Backups documentados

### 4. Redes

- [ ] Rede única ou comunicação estável entre serviços
- [ ] CRM → n8n funcional
- [ ] CRM/n8n → OCR funcional
- [ ] n8n → WAHA funcional (quando ativo)
- [ ] Sem dependência de IP dinâmico
- [ ] URLs estáveis e documentadas

### 5. Segurança

- [ ] Segredos somente em env ou credentials do n8n
- [ ] Nenhum segredo no Git
- [ ] Service role somente server-side
- [ ] Portas expostas apenas quando necessário
- [ ] Arquivos de sessão ignorados (.gitignore)
- [ ] Log sem dados sensíveis
- [ ] Secret scan executado

### 6. Resiliência

- [ ] Healthchecks configurados
- [ ] Restart policies: unless-stopped
- [ ] Ordem de inicialização
- [ ] Recuperação pós-reboot Docker
- [ ] Recuperação pós-reboot Windows
- [ ] Plano de rollback disponível
- [ ] Backup do n8n exportado
- [ ] Backup das configurações WAHA

### 7. Testes de Integração

- [ ] Login CRM (200 OK)
- [ ] Busca de cliente
- [ ] Timeline
- [ ] Central de Pendências
- [ ] Central de Atendimento
- [ ] Endpoint OCR (health)
- [ ] n8n acessível
- [ ] Workflow de teste (sem envio real)
- [ ] WAHA: somente se autorizado
- [ ] Vercel continua funcional

### 8. Classificação

Cada item classificado como:
- **APROVADO**
- **CORRIGIDO**
- **ACEITO COM BACKLOG**
- **BLOQUEADOR**

## Decisão Final

- [ ] **INFRAESTRUTURA APROVADA PARA FASE 4**
- [ ] **FASE 4 BLOQUEADA** (motivo: )

> A Fase 4 só pode ser liberada quando não houver bloqueadores.
