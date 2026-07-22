# TESTS — Relatório de Testes

## Fluxos Testados (Manualmente)

### 1. Envio de mensagem texto via chat-interface-v2
- **Método:** Manual via interface web (http://localhost:3001)
- **Payload:** FormData com `user_id`, `name`, `cargo`, `message`, `source=web_crm`
- **Resultado:** ✅ HTTP 200, resposta `{ "text": "..." }` do AI Agent
- **Observação:** Mensagem salva no Supabase `chat_messages` corretamente

### 2. Salvar no Buffer (Code node)
- **Método:** Teste via webhook curl/node
- **Payload:** POST `/webhook/crm-chat` com FormData
- **Resultado:** ✅ Mensagem inserida em `message_buffer` com `processed: false`
- **Observação:** Usa `this.helpers.httpRequest()` — bypass do bug do HTTP Request node

### 3. Webhook toggle via API
- **Método:** `node toggle_webhook.js`
- **Sequência:** Deactivate → Activate com body `{}`
- **Resultado:** ✅ Webhook `/webhook/crm-chat` registrado após restart
- **Observação:** Necessário após cada `docker compose restart n8n`

### 4. Autenticação via formulário de login
- **Método:** Playwright (`tests/login.spec.ts`)
- **Resultado:** ✅ Teste existente (de sessão anterior)

## Fluxos Não Testados

| Fluxo | Motivo | Prioridade |
|---|---|---|
| **Upload de arquivo (.pdf, .jpg, .png, .xlsx, .csv)** via chat | Frontend envia FormData, mas nenhum workflow processa os arquivos ainda | Alta |
| **Agente Comprovante (OCR)** | Workflow não existe no DB | Alta |
| **Agente Conciliação (CTN+Extrato)** | Workflow não existe no DB | Alta |
| **Roteamento por tipo de arquivo (Switch)** | Não implementado no workflow | Alta |
| **Google Calendar (criar/verificar/deletar eventos)** | OAuth não configurado | Alta |
| **Fluxo WhatsApp → n8n (WAHA webhook)** | WAHA rodando mas não testado | Média |
| **Admin/agentes page (toggle permissoes)** | GET e PUT da API não testados | Média |
| **Sidebar → link Agentes visível apenas para cargos corretos** | Não testado | Baixa |

## Casos de Erro Verificados

| Caso | Resultado Esperado | Resultado Obtido |
|---|---|---|
| Webhook chamado sem registrar (pós-restart) | 200 | ❌ **404** — Express retorna "Cannot POST /webhook/crm-chat" |
| HTTP Request node com `sendBody:true` | POST bem-sucedido | ❌ **TypeError** — `HttpRequestV3.node.ts:849` |
| n8n API deactivate sem body `{}` | 200 | ❌ **400** — espera DTO |
| Frontend sem conexão com n8n | Mensagem de erro amigável | ✅ "Desculpe, estou tendo dificuldades..." |

## Resultado Geral
- **Fluxo básico (texto → webhook → buffer → AI Agent → resposta):** Funcional
- **Fluxo com arquivos:** Frontend envia, mas backend não processa
- **Fluxo com agentes especializados:** Não implementado
- **Persistência pós-restart:** Requer script manual
