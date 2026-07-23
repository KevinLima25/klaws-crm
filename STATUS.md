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

## Conciliação Bancária (Sprint 2.3 / 2.3A)
- **Motor:** ✅ V2.3.0 funcional (8 regras determinísticas A-H)
- **API:** ✅ `POST /api/conciliacao` (executar), `GET /api/conciliacao` (consultar)
- **Testes:** ✅ 14 cenários via `POST /api/conciliacao/teste`
- **Frontend:** ✅ `/admin/conciliacao` (executar + visualizar resultados)
- **Migrations:** ✅ 00006 (conciliacoes), 00007 (logs), 00008 (hotfix arquitetural)
- **Novos campos:** `motor_version`, `lote_importacao`, `lote_conciliacao`, `lote_ocr`, `lote_whatsapp`
- **Novo status:** `AGUARDANDO_DOCUMENTO` (indicação de pagamento sem comprovante)
- **Build:** ✅ 25+ páginas, 0 erros TypeScript

## UX Sprint 1.1 — Responsividade e Mobile
- **Sidebar:** ✅ Auto-close em navegação mobile, fechamento via Escape
- **Touch targets:** ✅ Botões mínimo h-10, labels e controles com `touch-manipulation`
- **Overflow:** ✅ `overflow-x-hidden` global + por página, tabelas com `overflow-x-auto`
- **Layout:** ✅ Sidebar drawer + overlay, fechamento ao navegar (pathname watch)

## UX Sprint 1.2 — Dashboard Inteligente
- **API:** ✅ `/api/dashboard?period=N` — filtra por período, retorna status conciliação, imports recentes, comprovantes recentes, atividades
- **Período:** ✅ Filtro 7/30/90/todos os dias
- **Overview:** ✅ Cards reais: Importações, Comprovantes, Conciliações, Pendências
- **Status conciliação:** ✅ Grid com contagens por status
- **Atividades recentes:** ✅ Feed unificado de imports, comprovantes, conciliações
- **Atalhos:** ✅ Mantidos (Chat, Conciliação, Importar, Administrar)
- **Placeholders removidos:** ✅ "Em breve" (Agenda, WhatsApp, OCR, Relatórios) substituídos por dados reais

## UX Sprint 2.0 — Timeline do Cliente
- **Página:** ✅ `/crm/clientes/timeline` — busca por matrícula ou CPF
- **API:** ✅ `GET /api/clientes/timeline?matricula=X&days=365`
- **Fontes:** ✅ importações, conciliações, comprovantes (nunca por nome)
- **Interface:** ✅ cabeçalho do cliente, timeline cronológica, filtros por tipo, loading/empty/erro
- **Segurança:** ✅ RLS preservado, CPF mascarado, service role não exposto
- **Sidebar:** ✅ Link "Timeline" adicionado na navegação principal
