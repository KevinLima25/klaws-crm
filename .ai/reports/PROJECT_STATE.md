# KLAWS CRM — PROJECT STATE

**Data:** 2026-07-21
**Versão:** 1.0
**Sprint Atual:** 0.2 (Análise/Planejamento)

---

## RESUMO GERAL

| Métrica | Valor |
|---------|-------|
| **Health Score** | 45/100 |
| **Domínio mais maduro** | Frontend (Next.js + Auth + UI) |
| **Domínio mais crítico** | Automações n8n (workflows incompletos, webhook instável) |
| **Blockers ativos** | Migration 003 não aplicada, Google Calendar OAuth não configurado |

---

## STATUS POR DOMÍNIO (conforme ARCHITECTURE.md)

### Frontend (Next.js 16) — 🟢 85%
| Componente | Status |
|------------|--------|
| App Router + Layout | ✅ Completo |
| Autenticação (Supabase SSR) | ✅ Completo |
| Dashboard V2 (role-based) | ✅ Completo |
| Chat Interface V2 | ✅ Funcional (monolítico) |
| Perfil (avatar, nome, cargo) | ✅ Completo |
| Admin (users, sync, agentes config) | ✅ Completo |
| Testes E2E | ⚠️ Apenas login |
| Refatoração (hooks) | ❌ Pendente (TODO #10) |

### Banco (Supabase) — 🟡 55%
| Item | Status |
|------|--------|
| Migrations definidas | ✅ 3/3 |
| Migrations aplicadas | ⚠️ 2/3 (003 pendente) |
| Tabelas core | ✅ profiles, chat_messages, funcionarios, vendas, adimplencia |
| Tabelas agentes/buffer | ❌ message_buffer, comprovantes, agentes_config |
| RLS | ✅ Parcial (falta nas novas) |
| Storage/Buckets | ❌ Não definidos |
| Funções/Triggers | ✅ handle_new_user |

### Automações (n8n) — 🟠 35%
| Item | Status |
|------|--------|
| Workflow CRM Chat | ✅ Ativo (mas linear, sem router) |
| Workflow Agente_Agendamento | ⚠️ Inativo (OAuth pendente) |
| Master Router (Switch) | ❌ Não existe |
| Agente OCR | ❌ Não existe (config só no DB) |
| Agente Conciliação | ❌ Não existe (config só no DB) |
| Webhook persistence | ❌ Bug n8n (webhookId=null) |
| Healthcheck | ❌ Não configurado |
| Backup JSON workflows | ❌ Não versionado |

### Integrações — 🟡 45%
| Integração | Status |
|------------|--------|
| Supabase | ✅ Conectado |
| Google Gemini | ✅ Conectado |
| Google Calendar | ⚠️ OAuth pendente |
| Google Drive | ❌ Não configurado |
| OCR.space | ❌ Não configurado |
| WAHA | ⚠️ Container rodando, webhook n8n inexistente |
| Telegram | ⚠️ Apenas workflow inativo |
| Playwright | ✅ Configurado (testes mínimos) |

### DevOps/Docker — 🟡 60%
| Item | Status |
|------|--------|
| Docker Compose (3 serviços) | ✅ Funcional |
| Volumes persistentes | ✅ n8n data, waha sessions, crm code |
| Networks | ✅ bridge automation |
| Healthchecks | ❌ Ausentes |
| Secrets management | ❌ Hardcoded (n8n encryption key, WAHA keys) |
| CI/CD | ❌ Não existe |

---

## DÍVIDA TÉCNICA PRIORITÁRIA

| # | Item | Domínio | Esforço | Risco se não feito |
|---|------|---------|---------|-------------------|
| 1 | Aplicar Migration 003 | Banco | Baixo (manual) | **CRÍTICO** — buffer/agentes não funcionam |
| 2 | Google Calendar OAuth | Integração | Baixo (manual) | **ALTO** — Agenda não funciona |
| 3 | Master Router Switch | n8n | Médio | **ALTO** — Arquitetura quebrada |
| 4 | Agente OCR Workflow | n8n | Médio | **MÉDIO** — Comprovantes não processam |
| 5 | Agente Conciliação Workflow | n8n | Médio | **MÉDIO** — Conciliação não processa |
| 6 | Webhook auto-toggle | n8n/DevOps | Baixo | **MÉDIO** — Downtime pós-restart |
| 7 | Credenciais hardcoded | Segurança | Baixo | **MÉDIO** — Vazamento potencial |
| 8 | Testes E2E Chat | Frontend | Médio | **BAIXO** — Regressões silenciosas |

---

## ARQUITETURA: ESPERADO vs REAL

| Camada | ARCHITECTURE.md (Esperado) | Realidade | Gap |
|--------|---------------------------|-----------|-----|
| **Frontend** | Apenas UI, auth, dashboard, chat, forms, admin | ✅ Conforme | — |
| **Supabase** | Fonte única da verdade, todas tabelas, RLS, views | ⚠️ Mig 003 pendente | Tabelas agentes/buffer faltando |
| **n8n** | Orquestrador apenas, workflows por agente, Master Router | ❌ Linear, sem router, agentes inexistentes | **MAJOR** |
| **Master Router** | Switch por tipo arquivo → roteia para agente | ❌ Não existe | **CRÍTICO** |
| **Agentes** | Independentes: Atendimento, OCR, Conciliação, Agenda | ⚠️ Atendimento misturado no CRM Chat; Agenda duplicado; OCR/Conciliação só config | **MAJOR** |
| **Buffer** | Obrigatório antes do Router | ✅ Existe (Code node) mas no fluxo linear | Parcial |
| **Dashboard** | Consome Supabase (views/APIs), nunca workflows | ✅ Conforme | — |
| **Google Calendar** | Fonte oficial da agenda, Supabase só metadados | ⚠️ Tools no AI Agent, não workflow separado | Parcial |
| **Google Drive** | Apenas documentos, nunca banco | ❌ Não configurado | — |
| **OCR** | OCR.space + Playwright | ❌ Não implementado | — |

---

## PRÓXIMOS PASSOS IMEDIATOS (Ordem de Execução)

1. **Manual:** Aplicar `00003_add_comprovantes_agentes_config.sql` no Supabase SQL Editor
2. **Manual:** Registrar redirect URI Google Calendar no Google Cloud Console
3. **Sprint 1:** Criar Master Router Switch no workflow CRM Chat + export JSON backup
4. **Sprint 2:** Criar Workflow Agente OCR (`/webhook/agent-comprovante`)
5. **Sprint 3:** Criar Workflow Agente Conciliação (`/webhook/agent-conciliacao`)
6. **Sprint 4:** Auto-toggle webhook no startup (entrypoint script ou healthcheck)
7. **Sprint 5:** Mover credenciais para env vars / Docker secrets
8. **Sprint 6:** Testes E2E Chat + Refatorar chat-interface-v2.tsx (hooks)
9. **Sprint 7:** Google Drive OAuth + Storage buckets Supabase
10. **Sprint 8:** Power BI / Relatórios avançados

---

**NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.**