# IMPLEMENTATION_QUEUE.md
## Fila de Implementação — KLAWS CRM

**Baseado em:** RECOVERY_PLAN.md + ARCHITECTURE.md (regra: 1 domínio por Sprint)
**Data:** 2026-07-21
**Versão:** 1.0

---

## FORMATO
Cada Sprint contém:
- **Objetivo** único
- **Domínio** (Frontend | Banco | Automações | OCR | Agenda | Dashboard | Router | Infra | Segurança | Qualidade)
- **Arquivos Envolvidos** (máx 5)
- **Risco Principal**
- **Tempo Estimado**
- **Dependências**

---

## SPRINT 0 — PRÉ-REQUISITOS (Manual, Fora de Código)
| Item | Ação | Tempo |
|------|------|-------|
| 0.1 | Aplicar `00003_add_comprovantes_agentes_config.sql` no Supabase SQL Editor | 10 min |
| 0.2 | Registrar Redirect URI Google Calendar: `http://127.0.0.1:5678/rest/oauth2-credential/callback` | 10 min |
| 0.3 | Exportar JSON dos 2 workflows n8n atuais (backup versionado) | 5 min |

---

## SPRINT 1 — MASTER ROUTER + BUFFER FIX
**Domínio:** Router (Automações)
**Objetivo:** Implementar Switch de roteamento por tipo de arquivo no workflow CRM Chat + corrigir persistência file_data no Buffer
**Arquivos Envolvidos (≤5):**
1. n8n: Workflow WFCRM001chat01 (adicionar Switch node + 2 HTTP Request nodes)
2. n8n: Code node "Salvar no Buffer" (corrigir file_data BYTEA encoding)
**Risco:** Quebrar fluxo atual do chat se Switch mal configurado; webhookId=null persiste
**Tempo Estimado:** 4-6h
**Dependências:** Sprint 0 (tabelas message_buffer, comprovantes, agentes_config existem)

---

## SPRINT 2 — AGENTE OCR (COMPROVANTE)
**Domínio:** OCR (Automações)
**Objetivo:** Criar workflow independente `/webhook/agent-comprovante` para processar PDFs/imagens
**Arquivos Envolvidos (≤5):**
1. n8n: Novo workflow Agente OCR (export JSON → versionar em n8n/workflows/)
2. n8n: Credencial OCR.space API Key (configurar no n8n)
**Nós:** Webhook → HTTP Request (OCR.space) → Parse JSON → IF confidence → Set Response
**Risco:** OCR.space rate limits; formato resposta variável; confidence threshold tuning
**Tempo Estimado:** 6-8h
**Dependências:** Sprint 1 (Master Router roteia Imagem/PDF para este webhook), Sprint 0 (tabela comprovantes)

---

## SPRINT 3 — AGENTE CONCILIAÇÃO (CTN + EXTRATO)
**Domínio:** Automações
**Objetivo:** Criar workflow independente `/webhook/agent-conciliacao` para conciliação bancária
**Arquivos Envolvidos (≤5):**
1. n8n: Novo workflow Agente Conciliação (export JSON → versionar)
**Nós:** Webhook → Parse CSV/XLS (Code node) → Query Supabase comprovantes → Matcher → Set Response
**Risco:** Complexidade do matcher (lógica de cruzamento CTN vs Extrato); performance em datasets grandes
**Tempo Estimado:** 8-12h
**Dependências:** Sprint 1 (Master Router roteia Planilha para este webhook), Sprint 0 (tabela comprovantes)

---

## SPRINT 4 — AUTO-TOGGLE WEBHOOK + HEALTHCHECK
**Domínio:** Infra (Automações/DevOps)
**Objetivo:** Eliminar toggle manual pós-restart n8n via healthcheck + entrypoint script
**Arquivos Envolvidos (≤5):**
1. `docker-compose.yml` (adicionar healthcheck n8n + entrypoint)
2. `n8n/entrypoint.sh` (novo: wait n8n API → toggle webhook via API)
**Risco:** Entrypont mal configurado impede startup; healthcheck falha → container unhealthy
**Tempo Estimado:** 3-4h
**Dependências:** Sprint 0 (n8n API Key disponível), pode rodar em paralelo após Sprint 0

---

## SPRINT 5 — CREDENCIAIS EM ENV VARS / DOCKER SECRETS
**Domínio:** Segurança
**Objetivo:** Remover hardcoded keys (n8n API Key, Supabase Service Key, OCR.space, Gemini)
**Arquivos Envolvidos (≤5):**
1. `toggle_webhook.js` → ler `N8N_API_KEY` de process.env
2. n8n Workflow CRM Chat: Code node "Salvar no Buffer" → usar credential n8n ou env var
3. `docker-compose.yml` (adicionar secrets/env vars para n8n, crm, waha)
4. `.gitignore` (garantir ngrok.exe, .env.local, *.key não versionados)
**Risco:** Quebra se env var não propagada corretamente nos containers
**Tempo Estimado:** 2-3h
**Dependências:** Sprint 4 (healthcheck garante n8n API disponível para toggle)

---

## SPRINT 6 — TESTES E2E CHAT + REFACTOR CHATINTERFACE
**Domínio:** Qualidade (Frontend)
**Objetivo:** Playwright tests para fluxo chat completo + extrair hooks useChat/useFileUpload
**Arquivos Envolvidos (≤5):**
1. `crm/tests/chat.spec.ts` (novo: send message, upload file, bot response)
2. `crm/src/hooks/useChat.ts` (novo: estado mensagens, send, load)
3. `crm/src/hooks/useFileUpload.ts` (novo: selectedFiles, add/remove, format)
4. `crm/src/components/chat-interface-v2.tsx` (refatorar para usar hooks → ~150 linhas)
**Risco:** Refatoração introduz regressões no componente principal do chat
**Tempo Estimado:** 6-8h
**Dependências:** Sprint 1 (chat funcional com router estável)

---

## SPRINT 7 — GOOGLE DRIVE + SUPABASE STORAGE BUCKETS
**Domínio:** Arquivos/Integrações
**Objetivo:** Upload comprovantes → Google Drive + Supabase Storage buckets
**Arquivos Envolvidos (≤5):**
1. Supabase: Criar buckets `avatars`, `comprovantes` (SQL ou Dashboard)
2. n8n: Google Drive OAuth credencial + nodes Upload/Download
3. Agente OCR (Sprint 2): Salvar arquivo no Drive, gravar `arquivo_drive_id` em comprovantes
4. Frontend: Verificar `/api/upload-avatar` usa bucket `avatars`
**Risco:** OAuth scopes Drive API; permissões Service Account; CORS buckets
**Tempo Estimado:** 6-8h
**Dependências:** Sprint 2 (Agente OCR precisa salvar), Sprint 5 (credenciais em secrets)

---

## SPRINT 8 — AGENTE AGENDA INDEPENDENTE + TELEGRAM
**Domínio:** Agenda (Automações)
**Objetivo:** Separar Calendar do AI Agent principal + ativar/integrar Telegram
**Arquivos Envolvidos (≤5):**
1. n8n: Novo workflow Agente Agenda (HTTP Request trigger interno)
2. n8n: Ativar Agente_Agendamento (Telegram) OU migrar para workflow unificado
3. CRM Chat (Sprint 1): Remover tools Calendar do AI Agent, chamar Agente Agenda via HTTP
**Risco:** Duplicação de lógica; quebra agendamentos existentes; Telegram webhook config
**Tempo Estimado:** 4-6h
**Dependências:** Sprint 1 (Master Router), Sprint 0 (OAuth Calendar funcionando)

---

## SPRINT 9 — POWER BI / RELATÓRIOS AVANÇADOS
**Domínio:** Dashboard/BI
**Objetivo:** Dashboards executivos, exportações agendadas, Power BI conectado
**Arquivos Envolvidos (≤5):**
1. Supabase: Views/Functions para métricas agregadas (vendas, adimplência, comprovantes)
2. n8n: Workflow agendado (cron) → export CSV/Excel → Google Drive/Email
3. Power BI: Dataset DirectQuery no Supabase (ou scheduled refresh)
**Risco:** Performance DirectQuery; modelagem dimensional; refresh scheduling
**Tempo Estimado:** 8-16h
**Dependências:** Sprint 0, 1, 7 (dados completos no banco: comprovantes, buffer, agentes)

---

## SPRINT 10 — LIMPEZA + DOCUMENTAÇÃO + BACKUP VERSIONADO
**Domínio:** Manutenção
**Objetivo:** Remover scripts debug, documentar workflows, versionar JSON backups
**Arquivos Envolvidos (≤5):**
1. Raiz: Remover ~40 scripts `.js` debug (manter apenas `toggle_webhook.js`, `restart_n8n.bat`)
2. `n8n/workflows/` (novo dir): JSONs exportados de todos workflows ativos
3. `STATUS.md`, `TODO_NEXT.md`, `ARCHITECTURE_REVIEW.md` (atualizar)
4. `.ai/reports/CHANGELOG.md` (consolidar)
**Risco:** Remover script ainda necessário; documentação desatualizada
**Tempo Estimado:** 2-3h
**Dependências:** Todas anteriores estabilizadas

---

## VISÃO DE DEPENDÊNCIAS (CRITICAL PATH)

```
SPRINT 0 (Manual)
    │
    ▼
SPRINT 1 (Router) ──────────────────┐
    │                               │
    ▼                               │
SPRINT 2 (OCR)                      │
    │                               │
    ▼                               │
SPRINT 3 (Conciliação)              │
    │                               │
    ▼                               │
SPRINT 6 (Tests/Refactor)           │
    │                               │
    ▼                               │
SPRINT 7 (Drive/Storage) ◄──────────┤ (precisa Sprint 2 + 5)
    │                               │
    ▼                               │
SPRINT 9 (Power BI)                 │
    │                               │
    ▼                               │
SPRINT 10 (Cleanup)                 │
                                    │
SPRINT 4 (Auto-toggle) ─────────────┤ (PARALELO - pode rodar após Sprint 0)
    │                               │
    ▼                               │
SPRINT 5 (Secrets) ─────────────────┤ (PARALELO - após Sprint 4)
                                    │
SPRINT 8 (Agenda/Telegram) ─────────┘ (precisa Sprint 1 + Sprint 0 OAuth)
```

---

## RESUMO POR DOMÍNIO (ARCHITECTURE.md Regra: 1 domínio/Sprint)

| Sprint | Domínio | Tipo |
|--------|---------|------|
| 0 | — | Manual/Prep |
| 1 | Router (Automações) | Core |
| 2 | OCR (Automações) | Core |
| 3 | Automações | Core |
| 4 | Infra/Automações | Infra |
| 5 | Segurança | Segurança |
| 6 | Qualidade (Frontend) | Qualidade |
| 7 | Arquivos/Integrações | Integrações |
| 8 | Agenda (Automações) | Core |
| 9 | Dashboard/BI | BI |
| 10 | Manutenção | Manutenção |

---

## CRITÉRIOS DE "DONE" POR SPRINT

| Sprint | Done Criteria |
|--------|---------------|
| 1 | Switch roteia: texto→Atendimento, imagem/pdf→OCR, planilha→Conciliação; buffer salva file_data |
| 2 | POST /agent-comprovante retorna JSON com dados extraídos + confidence; salva em comprovantes |
| 3 | POST /agent-conciliacao retorna divergências/matches; performance < 30s para 1000 rows |
| 4 | `docker compose restart n8n` → webhook /crm-chat ativo em < 30s sem intervenção manual |
| 5 | Zero credenciais hardcoded em código/workflows; todas via env vars ou Docker secrets |
| 6 | `npm test` passa chat.spec.ts; chat-interface-v2.tsx < 200 linhas usando hooks |
| 7 | Upload comprovante → Google Drive + Supabase Storage; arquivo_drive_id populado |
| 8 | Agendamentos via chat funcionam; Telegram bot responde comandos Calendar |
| 9 | Power BI conectado ao Supabase; refresh automático diário; relatórios executivos |
| 10 | Raiz limpa (≤5 scripts); workflows versionados em n8n/workflows/; docs atualizadas |

---

**NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.**