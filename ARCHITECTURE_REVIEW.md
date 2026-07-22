# ARCHITECTURE REVIEW — Decisões Arquiteturais

## 1. Code Node no lugar de HTTP Request Node

### Decisão
Substituir o nó visual `HTTP Request` (POST para Supabase) por um `Code` node usando `this.helpers.httpRequest()`.

### Por que foi escolhida
O `HTTP Request` node (typeVersion 4.2) apresenta um TypeError sistêmico em `HttpRequestV3.node.ts:849` quando `sendBody: true` combinado com POST/PUT. O erro ocorre independentemente do payload ou URL — é um bug interno do nó. O `Code` node com `this.helpers.httpRequest()` é a API interna recomendada pela n8n para chamadas HTTP programáticas e não sofre desse bug.

### Alternativas existentes
1. **HTTP Request node com `sendBody: false`** — não envia o body, inviável para POST
2. **Downgrade do n8n** — versão anterior poderia não ter o bug, mas perderia outras features
3. **Esperar correção upstream** — sem previsão, trava o desenvolvimento

### Impacto futuro
- Workflow perdeu a consistência visual (nós configuráveis vs. código)
- Manutenção requer conhecimento de JavaScript/n8n API
- Se o bug for corrigido, migrar de volta é trivial (substituir Code por HTTP Request)

## 2. Simplificação do Workflow (remoção do buffer/router)

### Decisão
Remover os nós Wait (30s), Verificar Buffer e Switch de roteamento, deixando o workflow linear: Webhook → Salvar no Buffer → DADOS → AI Agent → Format Response.

### Por que foi escolhida
- Wait de 30s causava timeout na resposta do webhook (limite de conexão HTTP)
- O buffer/router completo depende dos workflows Agente Comprovante e Agente Conciliação, que não existem no banco
- Para validar o fluxo básico (texto → AI Agent), a simplificação era necessária

### Alternativas existentes
1. **Manter o buffer/router** com sub-workflows simulados (stubs) — criaria falsa sensação de completude
2. **Usar responseMode=responseNode** no webhook para responder imediatamente e processar em background — opção válida, mas muda o contrato com o frontend
3. **Webhook responseMode=lastNode com timeout maior** — não há configuração de timeout no webhook node

### Impacto futuro
- O workflow atual NÃO faz roteamento por tipo de arquivo
- Quando os agentes especializados forem criados, o Switch/router precisará ser readicionado
- A ausência do buffer com processamento assíncrono significa que requisições simultâneas podem se perder

## 3. Substituição de WEBHOOK_URL por N8N_WEBHOOK_URL

### Decisão
Trocar a variável `WEBHOOK_URL` (depreciada) por `N8N_WEBHOOK_URL=http://localhost:5678/`.

### Por que foi escolhida
- `WEBHOOK_URL` foi depreciada no n8n 2.30.7 e gera warnings no log
- `N8N_WEBHOOK_URL` é o formato oficial para n8n 2.x
- O valor anterior apontava para ngrok (túnel HTTPS), que não está mais em uso
- O webhook agora opera em ambiente local (`localhost`)

### Alternativas existentes
N/A — mudança mandatória para alinhar com o configuration schema do n8n.

### Impacto futuro
- Webhooks não funcionam via Internet (apenas localhost). Se precisar expor, reconfigure com ngrok ou domínio real

## 4. Script de Toggle via API (workaround pós-restart)

### Decisão
Criar `toggle_webhook.js` que usa a API REST do n8n para deactivate/activate o workflow, re-registrando a rota do webhook.

### Por que foi escolhida
- n8n 2.30.7 não registra webhooks sem `webhookId` na inicialização
- O API toggle força o re-registro da rota no Express
- Não há configuração ou flag para corrigir esse comportamento

### Alternativas existentes
1. **Adicionar `webhookId` ao path** — mas exigiria mudança no webhook node e no frontend
2. **Usar `responseMode=responseNode`** — não resolve o registro da rota
3. **Criar workflow via API em vez de editar o DB** — evitaria inconsistências, mas não resolve o bug de startup

### Impacto futuro
- Dependência de script externo para funcionamento pós-restart
- Se o container for restartado sem o script, o chat fica offline
- Ideal: hook no entrypoint do container que executa o toggle automaticamente

## Escalabilidade

| Aspecto | Análise |
|---|---|
| **Número de usuários** | O CRM Next.js + Supabase escala horizontalmente. n8n é single-instance. |
| **Número de workflows** | Atualmente 2. O n8n SQLite suporta centenas sem degradação. |
| **Filas de mensagens** | Sem buffer real — o current workflow é síncrono. Se o AI Agent demorar, a conexão HTTP pode timeout. |
| **Concorrência** | O current workflow processa uma requisição por vez (n8n single-thread para execução). Para alta concorrência, seria necessário n8n em cluster + Redis. |

## Performance

| Aspecto | Análise |
|---|---|
| **AI Agent (Gemini)** | Chamada HTTP externa ~1-5s. Principal gargalo do fluxo. |
| **Code node (Salvar no Buffer)** | <100ms — apenas POST HTTP para Supabase |
| **Restart n8n** | ~10-15s até o container ficar pronto + ~2s para o toggle |
| **Frontend (Next.js)** | SSR + React 19 com lazy loading. Performance boa. |

## Segurança

| Item | Status |
|---|---|
| **Supabase Service Key** | Exposta em `.env.local` e referenciada em código. Risco se o repositório for público. |
| **n8n API Key** | Hardcoded no `toggle_webhook.js`. Deveria ser lida de env var. |
| **OCR.space API Key** | Mencionada no SESSÃO_ESTADO.md e usada no workflow anterior. |
| **Google Calendar OAuth** | Não configurado — sem exposição. |
| **Row Level Security (Supabase)** | Implementado para `comprovantes`, `agentes_config`, `message_buffer` (via migration). |
| **Autenticação** | Supabase Auth com email/senha + sessão. Roles baseadas na tabela `funcionarios`. |
| **n8n sem autenticação** | A API do n8n requer `X-N8N-API-KEY`. A UI web também é acessível via localhost. |
