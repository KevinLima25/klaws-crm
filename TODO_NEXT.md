# KLAWS CRM — Próximas Tarefas (Priorizadas)

## ✅ Quality Gate (2026-07-23) — Aprovado

- **Build:** ✅ 27 páginas, 0 TypeScript errors
- **Lint:** ⚠️ 91 errors (pré-existentes, não bloqueiam)
- **Correções:** dashboard RPC `.catch()`, conciliacao campos `motor_version`/`lote_*`, `check_state.js` path

## 🔴 Próximo — UX 2.1 (Touch Targets e Refinamentos Mobile)

Iniciar conforme `ROADMAP_AUTONOMO.md` → `.ai/sprints/UX_2.1.md`

## 🟡 Backlog Técnico (não implementar agora)

### 1. Autenticar WAHA Session
- **O quê:** Escanear QR code via WAHA Dashboard
- **Risco:** WhatsApp não envia mensagens para o n8n

### 2. Google Calendar OAuth redirect
- **Por quê:** AI Agent precisa criar/verificar eventos

### 3. Dashboard RPC
- **Proposta técnica:** migration 00009 (`get_conciliacao_status_counts`)
- **Status:** Fallback ativo (mais lento, funcional)

### 4. Timeline pagination
- **Backlog UX:** cursor pagination futuro

### 5. OCR estruturado
- **Sprint UX 3.0:** extrair matrícula/CPF/documento/valor/data/hash
- **Pré-produção:** `comprovantes.matriculas` não populado

### 6. Mover Secrets para Docker Secrets
- **Risco:** 🔴 Chaves expostas no repositório

### 7. Healthchecks nos Containers
### 8. Limpeza scripts debug da raiz
