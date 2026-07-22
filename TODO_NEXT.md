# KLAWS CRM — Próximas Tarefas (Priorizadas)

## 🔴 Sprint 2 — Conciliação Bancária

### 1. Autenticar WAHA Session
- **O quê:** Escanear QR code via WAHA Dashboard para ativar recebimento de mensagens WhatsApp
- **Como:** Acessar http://localhost:3000/dashboard (credenciais: LimaSL / 147258369) → Sessions → webjs → QR Code
- **Risco:** Sem isso, WhatsApp não envia mensagens para o n8n

### 2. Configurar Google Calendar OAuth
- **O quê:** Registrar redirect URI e configurar OAuth no Google Cloud Console
- **Por quê:** AI Agent precisa criar/verificar eventos
- **Impacto:** Bloqueia agenda automatizada

### 3. Criar Agente Conciliação
- **O quê:** Workflow n8n para processar CTN + Extrato bancário
- **Nós esperados:** Webhook → Parse CSV/XLS → Buscar Comprovantes → Matcher → Divergências → Response
- **Dependência:** Migration 003 aplicada (tabela comprovantes existe)

## 🟡 Melhorias de Robustez

### 4. Mover Secrets para Docker Secrets
- **O quê:** Remover N8N_ENCRYPTION_KEY, WAHA_API_KEY, WAHA_DASHBOARD_PASSWORD do docker-compose.yml
- **Alternativa:** Usar .env não versionado
- **Risco:** 🔴 Crítico — chaves expostas no repositório

### 5. Adicionar Healthchecks nos Containers
- **O quê:** Healthcheck para n8n, ocr-service, waha, crm
- **Por quê:** Monitoramento básico sem ferramenta externa

### 6. Remover Scripts de Debug da Raiz
- **O quê:** Mover scripts sprint*.js para pasta própria
- **Por quê:** Poluição visual na raiz do projeto

## 🟢 Qualidade

### 7. Testes E2E para Fluxo de Chat
- **O quê:** Playwright tests para envio de mensagem, upload de arquivos, resposta do bot

### 8. Refatorar chat-interface-v2.tsx
- **O quê:** Extrair hooks `useChat` e `useFileUpload`
- **Por quê:** Componente com 374 linhas mistura lógica e UI
