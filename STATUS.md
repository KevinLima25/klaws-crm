# KLAWS CRM — Status Atual

## Review Gate UX 2.3 (2026-07-23) — Correções em Andamento

### Fase 2 (UX 2.0/2.1/2.2) — Todos concluídos
- **UX 2.0 Timeline do Cliente:** ✅ `/crm/clientes/timeline`, API filtros tipo/status
- **UX 2.1 Touch Targets:** ✅ 44px mínimos em button, input, switch, admin toggle, sidebar
- **UX 2.2 Central de Pendências:** ✅ API `/api/pendencias`, página `/admin/pendencias`, sidebar link
- **Build:** ✅ 29 páginas compiladas, 0 erros TypeScript

### Correções Review Gate
- **Dashboard RPC:** ✅ Migration 00009 criada — fallback eliminado
- **Touch target admin (olho senha):** ✅ `min-h-11 min-w-11` aplicado
- **.gitignore:** ✅ ngrok.exe, backups, crash.journal, tmp.sql, test-results adicionados
- **Artifacts removidos do tracking:** ✅ ngrok.exe, waha.sqlite3, crash.journal, tmp.sql, test-results, backup_WFCRM*.json, backups/

### Pendentes (validação/backlog)
- **OCR comprovantes.matriculas:** ⏳ Populado pelo N8N externamente; verificar em produção
- **WAHA Session:** ⏳ Aguardando scan QR code
- **Google Calendar OAuth:** ⏳ Não configurado

## Workflows n8n

### 1. CRM Chat (WFCRM001chat01) — ✅ Funcional
### 2. Agente_Comprovante (WFCRM001comp01) — ✅ Funcional (OCR Tesseract)
### 3. WAHA Webhook (WgnQElkUjRP7f0J4) — ✅ Ativo
### 4. Agente_Agendamento (UH5kg99biTCqPZ1F) — ❌ Inativo

## WAHA
- **Container:** ✅ Running (WEBJS)
- **Sessão:** ✅ Criada — aguardando scan QR

## Frontend
- **Build:** ✅ 29 páginas, 0 TS errors
- **Login/Dashboard/Chat/Perfil/Admin:** ✅ Funcionais
- **Timeline:** ✅ `/crm/clientes/timeline`
- **Pendências:** ✅ `/admin/pendencias`

## Conciliação Bancária — ✅ Motor V2.3.0, API, Frontend, Testes
