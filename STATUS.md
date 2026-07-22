# CRM Chat n8n Workflow - Status Atual

## Webhook
- **URL:** `POST /webhook/crm-chat`
- **Status:** Funcionando (após re-toggle via API)
- **Nota:** Após restart do n8n, executar `restart_n8n.bat` (ou `node toggle_webhook.js`) para re-registrar o webhook

## Workflow (CRM Chat - Simplified Webhook, ID: WFCRM001chat01)
```
CRM Webhook → Salvar no Buffer (Code) → DADOS (Set) → AI Agent (Gemini) → Format Response (Set)
```

### Nodes
1. **CRM Webhook** - POST /crm-chat, responseMode: lastNode
2. **Salvar no Buffer** (Code) - Salva mensagem no Supabase `message_buffer`
3. **DADOS** (Set) - Prepara dados para o AI Agent
4. **AI Agent** (Gemini) - Processa com Google Gemini + Google Calendar tools
5. **Format Response** (Set) - Formata resposta JSON `{ "text": "..." }`

## Buffer (Supabase message_buffer)
- Mensagens salvas automaticamente pelo Code node
- Colunas: `id, user_id, message, file_name, file_type, file_data, processed, created_at`
- Usa `this.helpers.httpRequest()` para bypass do TypeError do HTTP Request node

## Frontend
- **URL:** http://localhost:3001
- **Webhook:** `NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/crm-chat`
- Envia FormData: `user_id, name, cargo, message, source=web_crm, files`
- Espera resposta JSON com campo `text`

## Para reiniciar o n8n
```powershell
docker compose -f docker-compose.yml restart n8n
# Aguardar 15s
node toggle_webhook.js
```
Ou usar: `restart_n8n.bat`

## Problemas Conhecidos
1. **Webhook não persiste após restart** - Bug no n8n 2.30.7 (webhooks sem webhookId não são registrados na inicialização). Solução: API toggle via `toggle_webhook.js`
2. **HTTP Request node typeVersion 4.2** - TypeError em POST/PUT com `sendBody:true`. Workaround: usar Code node com `this.helpers.httpRequest()`
3. **API deactivate/activate requer body `{}`** - O endpoint espera um DTO, mesmo vazio
