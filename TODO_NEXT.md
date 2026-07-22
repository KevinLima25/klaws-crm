# TODO NEXT — Próximas Tarefas (Priorizadas)

## 🔴 Alta Prioridade (Funcionamento Básico)

### 1. Aplicar Migration SQL no Supabase
- **O quê:** Executar `00003_add_comprovantes_agentes_config.sql` no SQL Editor do Supabase
- **Por quê:** Sem isso, as tabelas `message_buffer`, `agentes_config` e `comprovantes` não existem
- **Como:** Acessar https://supabase.com → SQL Editor → colar o conteúdo do arquivo

### 2. Configurar Google Drive OAuth no n8n
- **O quê:** Registrar redirect URI `http://127.0.0.1:5678/rest/oauth2-credential/callback` no Google Cloud Console
- **Por quê:** AI Agent não consegue criar/verificar/deletar eventos no Google Calendar
- **Passos:** Descritos em SESSÃO_ESTADO.md seção A

### 3. Criar Agente Comprovante (OCR) Workflow
- **O quê:** Workflow n8n separado com webhook `/webhook/agent-comprovante`
- **Nós:** Webhook → OCR.space → Parse → IF confidence → Response
- **Por quê:** É o primeiro agente necessário para processar PDFs/imagens de comprovantes

### 4. Criar Agente Conciliação (CTN+Extrato) Workflow
- **O quê:** Workflow n8n separado com webhook `/webhook/agent-conciliacao`
- **Nós:** Webhook → Parse CSV/XLS → Buscar Comprovantes → Matcher → Response
- **Por quê:** Segundo agente necessário para conciliação bancária

## 🟡 Média Prioridade (Robustez)

### 5. Reimplementar Router no Workflow Mestre
- **O quê:** Adicionar Switch de tipo de arquivo entre Salvar no Buffer e DADOS
- **Fluxo:** Texto → AI Agent atual | Imagem/PDF → POST /webhook/agent-comprovante | Planilha → POST /webhook/agent-conciliacao
- **Por quê:** Roteamento automático baseado no tipo de arquivo enviado

### 6. Automatizar Toggle Webhook no Startup do Container
- **O quê:** Modificar entrypoint do n8n ou criar script de healthcheck que executa toggle
- **Por quê:** Eliminar dependência de execução manual pós-restart
- **Sugestão:** Docker Compose healthcheck com curl + API call, ou script de init no volume

### 7. Remover Credenciais Hardcoded
- **Arquivos:** `toggle_webhook.js`, debug scripts
- **O quê:** Mover n8n API Key para env var; mover Supabase Service Key para secrets do Docker
- **Por quê:** Segurança — risco de exposição em versionamento

## 🟢 Baixa Prioridade (Qualidade)

### 8. Limpar Scripts de Debug da Raiz
- **O quê:** Remover ~40+ scripts `.js` avulsos usados para debugging
- **Por quê:** Poluição visual. Manter apenas `toggle_webhook.js`, remover o resto após estabilização

### 9. Adicionar Testes E2E para Fluxo de Chat
- **O quê:** Playwright tests para envio de mensagem, upload de arquivos, resposta do bot
- **Arquivo:** `crm/tests/chat.spec.ts`
- **Por quê:** Detecção precoce de regressão

### 10. Refatorar chat-interface-v2.tsx
- **O quê:** Extrair hooks `useChat` e `useFileUpload`
- **Por quê:** Componente tem 374 linhas com lógica misturada (374 linhas → ~150 com hooks)
