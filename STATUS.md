# KLAWS CRM — Status Atual

## Workflows n8n

### 1. CRM Chat (WFCRM001chat01)
- **Webhook:** `POST /webhook/crm-chat`
- **Status:** ✅ Funcional
- **Pipeline:** Webhook → Salvar Buffer → Master Router (IF chain) → AI Agent (Gemini) → Response
- **Master Router:** 5 IF nodes: Comprovante? → Imagem? → PDF? → Audio? → Video? → fallback DADOS (texto)

### 2. Agente_Comprovante (WFCRM001comp01)
- **Webhook:** `POST /webhook/comprovante`
- **Status:** ✅ Funcional
- **Pipeline:** Webhook → VALIDAR ARQUIVO → Valido? → TEM BINARIO? → Write Binary File → EXECUTAR OCR (Tesseract) → SALVAR OCR .TXT → Set Metadados → RESPOSTA SUCESSO / RESPOSTA ERRO
- **OCR Local:** Tesseract via microserviço HTTP (ocr-service:3002)

### 3. WAHA Webhook (WgnQElkUjRP7f0J4)
- **Webhook:** `POST /webhook/waha`
- **Status:** ✅ Webhook ativo, transporte validado
- **Pipeline:** Webhook → Encaminhar CRM Chat → Response
- **Nota:** Depende do Gemini AI — respostas podem falhar com rate limiting da API

### 4. Agente_Agendamento (UH5kg99biTCqPZ1F)
- **Status:** ❌ Inativo
- **Trigger:** Telegram (não configurado)

## WAHA (WhatsApp)
- **Container:** ✅ Running (devlikeapro/waha, engine WEBJS)
- **Sessão:** ✅ Criada (webjs) — aguardando scan QR code para autenticar
- **Webhook n8n:** ✅ Criado em `/webhook/waha`
- **Transporte:** ✅ Validado — mensagens são encaminhadas ao CRM Chat

## Frontend (CRM Web)
- **URL:** http://localhost:3001
- **Login:** ✅ Funcional
- **Dashboard:** ✅ Funcional (vendas + adimplência)
- **Chat:** ✅ Funcional (envia para n8n CRM Chat)
- **Perfil:** ✅ Funcional (avatar, nome, cargo)
- **Admin:** ✅ Funcional (usuários, agentes config)

## Webhook Persistence
- **Bug:** `webhookId=null` para todos os webhooks — limitação do n8n 2.30.7
- **Status:** Webhooks funcionam mesmo com `webhookId=null` — o registro persiste via `webhook_entity` (path-based)
- **Recomendação:** Após restart do n8n, verificar se webhooks estão registrados. Reactivar workflow se necessário.
