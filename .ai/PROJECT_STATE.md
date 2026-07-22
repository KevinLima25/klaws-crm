# KLAWS CRM — PROJECT STATE

**Data:** 2026-07-22
**Versão:** 1.2
**Sprint Atual:** Sprint 1.8R (Integração CRM Chat → Agente_Comprovante com binário)
**Commit:** `a2a0103` (Sprint 1.8R - integração binário)
**Branch:** `master`

---

## RESUMO GERAL

| Métrica | Valor |
|---|---|
| **Health Score** | 50/100 |
| **Maturidade (0-10)** | 5.0 / 10 |
| **Risco Atual** | 🟠 MÉDIO |
| **Domínio mais maduro** | Frontend (Next.js + Auth + UI) — 85% |
| **Domínio mais crítico** | Automações n8n (workflows incompletos, webhook instável) — 35% |
| **Blockers ativos** | Migration 003 não aplicada, Google Calendar OAuth não configurado, OCR.space API key ausente |
| **Recomendação** | CONTINUAR — com correções urgentes de segurança e estabilidade |

---

## STATUS POR DOMÍNIO

### Frontend (Next.js 16 + React 19 + Tailwind v4 + shadcn) — 🟢 85%

| Componente | Status | Obs |
|---|---|---|
| App Router + Layout | ✅ Completo | Layout com sidebar + dark theme |
| Autenticação (Supabase SSR) | ✅ Completo | Login/registro, auth callback, middleware |
| Dashboard V2 (role-based) | ✅ Completo | Rankings de vendas/adimplencia por cargo |
| Chat Interface V2 | ✅ Funcional | Monolítico (374 linhas), file upload, tabs |
| Perfil (avatar, nome, email, cargo) | ✅ Completo | Upload avatar via Storage |
| Admin (criar usuário) | ✅ Completo | POST /api/create-user |
| Admin (sync funcionarios) | ✅ Completo | POST /api/sync-funcionarios |
| Admin (agentes config) | ✅ Completo | Toggle switches por cargo x agente |
| Sidebar (role-based) | ✅ Completo | Links condicionais por cargo, badge chat |
| Testes E2E | ⚠️ Apenas login | 1 spec, 3 testes |
| Refatoração (hooks) | ❌ Pendente | `src/hooks/` vazio |
| Componentes v1 (duplicados) | ⚠️ Existem | dashboard.tsx, chat-interface.tsx não removidos |

### API Routes (Next.js) — 🟢 80%

| Rota | Método | Status | Obs |
|---|---|---|---|
| `/api/agentes-config` | GET/PUT | ✅ Funcional | Admin client, upsert |
| `/api/create-user` | POST | ✅ Funcional | Cria ou atualiza |
| `/api/dashboard` | GET | ✅ Funcional | 3 tabelas, sem paginação |
| `/api/me` | GET | ✅ Funcional | Fallback profiles + listUsers |
| `/api/profile` | PUT | ✅ Funcional | Nome + avatar_url |
| `/api/sync-funcionarios` | POST | ✅ Funcional | Loop O(n²) com listUsers |
| `/api/upload-avatar` | POST | ✅ Funcional | Storage avatars |

### Banco (Supabase) — 🟡 55%

| Item | Status | Obs |
|---|---|---|
| Migrations definidas | ✅ 3/3 | 00001, 00002, 00003 |
| Migrations aplicadas | ⚠️ 2/3 | **003 pendente — CRÍTICO** |
| profiles | ✅ Aplicada | RLS ativo |
| chat_messages | ✅ Aplicada | RLS ativo |
| funcionarios | ✅ Aplicada | ❌ Sem RLS |
| vendas | ✅ Aplicada | ❌ Sem RLS |
| adimplencia | ✅ Aplicada | ❌ Sem RLS |
| comprovantes | ❌ Migration 003 não aplicada | RLS configurado na migration |
| agentes_config | ❌ Migration 003 não aplicada | RLS configurado na migration |
| message_buffer | ❌ Migration 003 não aplicada | RLS configurado na migration |
| Storage/Buckets | ⚠️ Apenas avatars | Criado automaticamente |
| Funções/Triggers | ✅ handle_new_user | Cria profile ao registrar |
| Views SQL | ❌ Não implementado | Dashboard usa API Route direto |

### Automações (n8n) — 🟠 45%

| Workflow | Status | Obs |
|---|---|---|
| CRM Chat (WFCRM001chat01) | ✅ Ativo | 18 nós, Master Router + Detectar Comprovante + Code node (Enviar para Agente Comprovante) |
| Agente_Comprovante (WFCRM001comp01) | ✅ Ativo | 6 nós: Webhook → Validar → Valido? → TEM BINARIO? → Write Binary File → Set Metadados → Responder |
| Agente Comprovante/OCR (WFCRM001ocr01) | ❌ Falhando | HTTP 400 — OCR.space API key inválida |
| Agente_Agendamento (UH5kg99biTCqPZ1F) | ❌ Inativo | Telegram trigger, 10 nós |
| Master Router (IF chain) | ✅ Implementado | 5 IF nodes: Comprovante?, Imagem?, PDF?, Audio?, Video? → fallback DADOS |
| Agente Conciliação | ❌ Não existe | Workflow não criado |
| Webhook persistence | ❌ Bug | webhookId=null, some após restart |
| Backup JSON | ❌ Não existe | Risco de perda total |

### WAHA (WhatsApp) — 🟠 30%

| Item | Status | Obs |
|---|---|---|
| Container | ✅ Running | devlikeapro/waha |
| Sessão webjs | ✅ Conectada | SQLite session |
| Webhook no n8n (/webhook/waha) | ❌ **Não existe** | WAHA envia eventos mas n8n não recebe |
| Media directory | ✅ Montado | ./waha/media |

### Google — 🔴 10%

| Serviço | Status | Obs |
|---|---|---|
| Gemini AI | ✅ Conectado | Credencial no n8n, funcional |
| Calendar OAuth | ⚠️ Parcial | Credencial existe mas redirect URI não registrado |
| Calendar Tools | ❌ Quebrado | VERIFICAR AGENDA, Criar Evento, Delete sem auth |
| Drive OAuth | ❌ Não configurado | — |
| Drive Storage | ❌ Não configurado | — |

### OCR — 🔴 10%

| Item | Status | Obs |
|---|---|---|
| OCR.space Workflow | ❌ Falhando | HTTP 400 — API key inválida/ausente |
| OCR.space API Key | ❌ Não configurada | Não encontrada no projeto |
| Playwright OCR | ❌ Não implementado | Mencionado na arquitetura |

### Conciliação — 🔴 0%

| Item | Status | Obs |
|---|---|---|
| Workflow | ❌ Não existe | Não criado |
| CTN processing | ❌ Não existe | — |
| Extrato processing | ❌ Não existe | — |

### Telegram — 🟡 20%

| Item | Status | Obs |
|---|---|---|
| Workflow | ❌ Inativo | UH5kg99biTCqPZ1F |
| Bot Token | ❌ Não verificado | — |
| Integração funcional | ❌ Não existe | — |

### DevOps/Docker — 🟡 60%

| Item | Status | Obs |
|---|---|---|
| Docker Compose | ✅ 3 serviços | waha, n8n, crm |
| Volumes persistentes | ✅ Configurados | n8n data, waha sessions, crm code |
| Networks | ✅ bridge automation | — |
| Portas | ✅ 3000, 5678, 3001 | — |
| Healthchecks | ❌ Ausentes | Nenhum container |
| Secrets management | ❌ Hardcoded | N8N_ENCRYPTION_KEY, WAHA_API_KEY no compose |
| ngrok URL | ⚠️ Hardcoded | Tunnel público instável |
| CI/CD | ❌ Não existe | — |

### Testes — 🔴 10%

| Tipo | Status | Cobertura |
|---|---|---|
| Playwright E2E | ⚠️ Mínimo | 3 testes (login apenas) |
| API Routes | ❌ Nenhum | 0% |
| n8n Workflows | ⚠️ Manual | Apenas fluxo chat texto |
| Supabase RLS | ❌ Nenhum | 0% |
| Unitários | ❌ Nenhum | 0% |

### Segurança — 🟡 40%

| Item | Status | Obs |
|---|---|---|
| N8N_ENCRYPTION_KEY | ❌ Versionada | 🔴 Crítico — no docker-compose.yml |
| Service Role Key | ⚠️ Exposta | Em .env.local + usada em APIs |
| WAHA_API_KEY | ❌ Versionada | No docker-compose.yml |
| RLS (funcionarios, vendas, adimp.) | ❌ Ausente | 🔴 Dados expostos |
| RLS (comprovantes, etc.) | ❌ Migration pendente | 🔴 Tabelas não existem |
| n8n API Key em scripts | ❌ Hardcoded | toggle_webhook.js e outros |
| ngrok.exe versionado | ⚠️ Sim | No repositório git |
| OAuth secrets | ❌ Não configurado | Calendar, Drive |

---

## DÍVIDA TÉCNICA PRIORITÁRIA

| # | Item | Domínio | Esforço | Risco se não feito |
|---|---|---|---|---|
| 1 | Aplicar Migration 003 | Banco | 5min | **CRÍTICO** — buffer/agentes não funcionam |
| 2 | Exportar backup JSON workflows | n8n | 30min | **CRÍTICO** — perda total de automações |
| 3 | Configurar OCR.space API Key | OCR | 15min | **CRÍTICO** — OCR 100% quebrado |
| 4 | Google Calendar OAuth redirect URI | Google | 1h | **ALTO** — Agenda não funciona |
| 5 | Remover N8N_ENCRYPTION_KEY do compose | Segurança | 15min | **ALTO** — descriptografia de credenciais |
| 6 | Corrigir webhookId null | n8n | 2h | **ALTO** — chat cai após restart |
| 7 | Criar webhook WAHA no n8n | n8n | 1h | **ALTO** — WhatsApp não processa |
| 8 | Implementar Master Router Switch | n8n | ✅ Concluído | IF chain (image/pdf/audio/video/text) |
| 9 | Adicionar RLS em tabelas existentes | Banco | 1h | **ALTO** — dados expostos |
| 10 | Implementar OCR no Agente_Comprovante | n8n | 2h | **MÉDIO** — OCR ainda não lê comprovantes |
| 11 | Criar Agente Conciliação workflow | n8n | 4h | **MÉDIO** — conciliação não processa |
| 12 | Auto-toggle webhook no startup | n8n | 2h | **MÉDIO** — downtime pós-restart |
| 13 | Loop O(n²) em sync-funcionarios | API | 1h | **MÉDIO** — timeout com +200 users |
| 14 | Healthcheck Docker | DevOps | 1h | **MÉDIO** — sem monitoramento |
| 15 | Remover ngrok.exe do git | Git | 1min | **BAIXO** — poluição |
| 16 | Mover scripts debug para pasta | Organização | 30min | **BAIXO** — poluição |
| 17 | Testes E2E chat/dashboard/admin | Testes | 2d | **BAIXO** — regressões silenciosas |

---

## BLOCKERS ATIVOS

| Blocker | Impacto | Para desbloquear |
|---|---|---|
| Migration 003 não aplicada | Tabelas comprovantes, agentes_config, message_buffer não existem | Executar SQL no Supabase SQL Editor |
| OCR.space API key ausente | Workflow OCR 100% falhando (HTTP 400) | Obter chave em ocr.space e configurar no n8n |
| Google Calendar OAuth redirect não registrado | Ferramentas de calendário no AI Agent quebradas | Adicionar redirect URI no Google Cloud Console |
| WAHA webhook não existe no n8n | Mensagens WhatsApp não processadas | Criar webhook /webhook/waha no n8n |
| webhookId null (CRM Chat) | Webhook some após restart do n8n | Reativar manualmente ou corrigir workflow |

---

## ARQUITETURA: ESPERADO vs REAL

| Camada | ARCHITECTURE.md (Esperado) | Realidade | Gap |
|---|---|---|---|
| **Frontend** | Apenas UI, auth, dashboard, chat, forms, admin | ✅ Conforme | — |
| **Supabase** | Fonte única da verdade, todas tabelas, RLS, views | ⚠️ Mig 003 pendente | 3 tabelas faltando |
| **n8n** | Orquestrador apenas, workflows por agente, Master Router | ❌ Linear, sem router, agentes incompletos | **MAJOR** |
| **Master Router** | IF chain por tipo → roteia para agente | ✅ IF chain: Comprovante?/Imagem?/PDF?/Audio?/Video? → placeholders | **OK** |
| **Agente Comprovante** | Webhook → Validar → Extrair → Salvar → Responder | ✅ WFCRM001comp01 ativo | **OK** |
| **Agentes** | Independentes: Atendimento, OCR, Conciliação, Agenda | ⚠️ Atendimento no CRM Chat; OCR quebrado; Conciliação inexistente | **MAJOR** |
| **Buffer** | Obrigatório antes do Router | ✅ Existe (Code node) mas em fluxo linear | Parcial |
| **Dashboard** | Consome Supabase (views/APIs), nunca workflows | ✅ Conforme | — |
| **Google Calendar** | Fonte oficial da agenda | ⚠️ Tools no AI Agent, sem auth | Parcial |
| **Google Drive** | Apenas documentos, nunca banco | ❌ Não configurado | — |
| **OCR** | OCR.space + Playwright | ❌ Workflow existe mas falha | — |
| **Conciliação** | Extrato + CTN + divergências | ❌ Não implementado | — |

---

## FLUXOS VALIDADOS vs NÃO VALIDADOS

| Fluxo | Status | Validação |
|---|---|---|
| Login → Dashboard | ✅ OK | Testado manualmente + Playwright |
| Chat (texto) → Webhook → Buffer → Master Router (IF chain) → DADOS → AI Agent → Resposta | ✅ OK | Testado manualmente com POST /webhook/crm-chat |
| File upload → Webhook → Buffer → Master Router (IF chain) → OCR_PENDING (Imagem/PDF) / AUDIO_PENDING / VIDEO_PENDING | ⚠️ Placeholder | Roteamento funciona, nós placeholder sem lógica |
| WAHA → Webhook → n8n | ❌ Falha | Webhook não existe |
| Google Calendar → Criar evento | ❌ Falha | OAuth incompleto |
| Admin → Sync funcionarios | ✅ OK | Testado manualmente |
| Admin → Criar usuario | ✅ OK | Testado manualmente |
| Admin → Agentes config | ⚠️ Parcial | Frontend funciona, migration não aplicada |
| Perfil → Upload avatar | ✅ OK | Testado manualmente |

---

## MÉTRICAS DO PROJETO

| Métrica | Valor |
|---|---|
| Linhas de código (frontend) | ~3500 (src/) |
| Componentes React | 16 (10 ui + 6 feature) |
| API Routes | 7 |
| Páginas | 8 (/login, /crm, /crm/chat, /crm/perfil, /admin, /admin/agentes, /auth/callback, /) |
| Migrations SQL | 3 |
| Tabelas Supabase (aplicadas) | 5 |
| Tabelas Supabase (pendentes) | 3 |
| Workflows n8n ativos | 3 (2 funcionais, 1 falhando) |
| Workflows n8n inativos | 1 |
| Containers Docker | 3 |
| Scripts debug (.js/.py/.bat) | 75+ |
| Testes E2E | 3 (1 spec) |
| Bugs conhecidos | 10 |
| Pendências abertas | 23 |
| Dívida técnica (itens) | 17 |

---

## Sprint 1.5 — Master Router (2026-07-22)

**Objetivo:** Transformar fluxo linear do CRM Chat em Master Router com roteamento por tipo de arquivo.

**Mudanças:**
- Substituído Switch node (n8n v2.30.7 — bug de fallback com 4+ regras) por 4 IF nodes encadeados
- Adicionados 4 nós placeholder: OCR_PENDING (Imagem), OCR_PENDING (PDF), AUDIO_PENDING, VIDEO_PENDING
- Buffer Code node preservado (rota para `text` por padrão)
- Expressão de roteamento: `$json.body._file_type || $json.body.file_type || "text"`
- Fluxo de texto verificado: 200 OK com resposta do AI Agent

---

## Sprint 1.6 — Agente Comprovante (Estrutura) (2026-07-22)

**Objetivo:** Criar estrutura do Agente de Comprovantes sem IA paga.

**Mudanças no CRM Chat (WFCRM001chat01):**
- Adicionado "Detectar Comprovante" Code node: detecta comprovantes por keywords no filename (comprovante, boleto, pagamento, pix, etc.)
- Adicionado "Router: Comprovante?" IF node: 5ª rota no Master Router
- Adicionado "HTTP Request - Chamar Agente Comprovante": redireciona comprovantes ao Agente_Comprovante via webhook
- Chain: Buffer -> Detectar Comprovante -> Router: Comprovante?[T] -> HTTP Request -> Agente_Comprovante
                                            Router: Comprovante?[F] -> Router: Imagem? -> chain anterior

**Workflow Agente_Comprovante (WFCRM001comp01):**
- Webhook /webhook/comprovante -> Validar Arquivo -> Valido? (IF) -> [T] Extrair e Salvar -> Resposta Sucesso
                                                                   [F] -> Resposta Erro
- Valida: arquivo existe, extensao [pdf,jpg,jpeg,png], mime type [image/jpeg,image/png,application/pdf]
- Salva em: /home/node/.n8n/comprovantes/entrada/ (pasta local n8n)
- Objeto JSON padrao: arquivo, origem, mime, tamanho, status, ocr, conciliacao, created_at
- Sem OCR, sem IA, sem APIs pagas

**Fluxos verificados:**
- Texto sem arquivo -> fluxo normal (AI Agent) 200 OK
- Arquivo com keyword comprovante -> Agente_Comprovante -> resposta com status/id_interno
- Arquivo com extensao invalida -> erro de validacao
- Arquivo ausente -> erro "Nenhum arquivo recebido"

## Sprint 1.7 — Pipeline Comprovantes (Hash, Metadata, Dedup) (2026-07-22)

**Objetivo:** Pipeline completa com hash, ID único, dedup, metadata e pastas organizadas.

### Workflow Atual (WFCRM001comp01) — 15 nós

Pipeline: Webhook Comprovante → VALIDAR ARQUIVO (Code) → Valido? (IF) → [T] GERAR HASH SHA256 → GERAR ID COMPROVANTE → VERIFICAR DUPLICIDADE → É DUPLICADO? (IF) → [T] MOVER PARA DUPLICADOS → RESPOSTA DUPLICADO / [F] MOVER PARA PROCESSANDO → GERAR METADATA → SALVAR METADATA → MOVER PARA PROCESSADOS → RESPOSTA SUCESSO

### Descoberta Crítica: Runner Sandbox Restrito

n8n com `N8N_RUNNERS_ENABLED=true` proíbe todos `require()` em Code nodes:

| Módulo | Status |
|---|---|
| `fs`, `crypto`, `path`, `buffer`, etc. | ❌ "Module 'X' is disallowed" |
| `fetch`, Web Crypto API | ❌ undefined |
| **Buffer**, **Math**, **Date**, **JSON**, **console** | ✅ Globals |
| **atob/btoa**, **TextEncoder/TextDecoder** | ✅ Globals |
| `$input`, `$binary`, `item.binary` | ✅ n8n runtime |

`N8N_CODE_NODE_ENABLED_MODULES=fs,crypto` **não funciona** nesta versão.

**Consequência:** Sem `require('fs')` → sem leitura/escrita de disco → metadata não persiste, dedup não funciona, arquivos não salvos. Solução futura: usar nós n8n built-in (Write Binary File, Read/Write File from Disk).

### Testes (7 cenários)

| # | Cenário | Resultado |
|---|---|---|
| 1 | PDF válido | ✅ PASS — `status:"processado"`, hash calculado |
| 2 | JPG válido | ✅ PASS — hash diferente do PDF |
| 3 | PNG válido | ✅ PASS — hash diferente |
| 4 | Sem extensão | ✅ PASS — `"Extensao invalida: noext"` |
| 5 | .exe inválido | ✅ PASS — `"Extensao invalida: exe"` |
| 6 | Sem arquivo | ✅ PASS — `"Nenhum arquivo recebido"` |
| 7 | Reenvio mesmo PDF | ❌ FAIL — ambos "processado" (sem fs, sem dedup) |

### Aprendizados Técnicos
- `$binary` funciona: `Buffer.isBuffer(bin.data)` e `typeof bin.data === 'string'` para base64
- Iteração de bytes: `new Uint8Array(buf.buffer || buf)`
- DB recovery: `VACUUM INTO` + restart container após corrupção
- API deactivate/reactivate essencial após toda atualização de workflow
- API PUT + POST activate é o método correto de deploy (vs DB direto)

---

## Sprint 1.7R — Refatoração Agente_Comprovante para nós nativos (2026-07-22)

**Objetivo:** Substituir Code nodes problemáticos (sem acesso a fs/crypto) por nós n8n built-in + refatorar pipeline para 6 nós.

**Mudanças:**
- Substituídos 10+ Code nodes problemáticos por 6 nós nativos (Webhook → Validar → IF → Write Binary File → Set Metadados → Responder)
- `N8N_RUNNERS_ENABLED=true` bloqueava `require()` → solução: nós built-in
- Write Binary File salva em `/home/node/.n8n-files/comprovantes/entrada/` (fora do escopo do SecurityConfig)
- Pipeline simplificado: Webhook → VALIDAR ARQUIVO → Valido? → TEM BINARIO? → Write Binary File → Set Metadados → RESPOSTA SUCESSO
- 8/8 cenários de teste passaram

**Descoberta:** `SecurityConfig.restrictFileAccessTo` padrão bloqueia escrita fora de `~/.n8n-files`. Solução: salvar em `/home/node/.n8n-files/comprovantes/entrada/`.

---

## Sprint 1.8R — Integração CRM Chat → Agente_Comprovante com binário real (2026-07-22)

**Objetivo:** Encaminhar binário real do CRM Chat para o Agente_Comprovante via Code node com base64 em JSON.

**Problema Original:** HTTP Request v4.1 não suporta multipart com binário (só >= 4.2, que tem bug). CRM Chat enviava JSON-only (file_name, file_type como strings), Agente_Comprovante nunca recebia o arquivo real.

**Solução:**
1. Substituído "HTTP Request - Chamar Agente Comprovante" por Code node "Enviar para Agente Comprovante"
2. Code node lê `$binary` via `this.helpers.getBinaryDataBuffer(0, binKey)`, converte para base64, envia como JSON
3. VALIDAR ARQUIVO atualizado para aceitar `file_base64` do JSON, decodificar e criar binary output
4. Validações: tamanho máximo 20MB, extensão [pdf,jpg,jpeg,png], MIME compatível
5. JSON-only (sem file_base64) rejeitado com "arquivo_binario_ausente"
6. Volume Docker adicionado: `./n8n/n8n-files:/home/node/.n8n-files` (persistência)
7. Nodes órfãos removidos: HTTP Request - Agente OCR, HTTP Request - Agente Conciliação (CRM Chat), 10 orphans do pipeline antigo (Agente_Comprovante)

**Bug Crítico Encontrado:** `this.helpers.getBinaryDataBuffer(bin.id)` — assinatura correta é `getBinaryDataBuffer(itemIndex, string|IBinaryData)`. Passar `bin.id` como primeiro argumento (string) retorna buffer de 9 bytes. Corrigido para `getBinaryDataBuffer(0, binKey)`.

**Testes (7 cenários, 6/7 pass):**

| # | Cenário | Resultado |
|---|---|---|
| 1 | PDF via CRM Chat → Code node → Agente_Comprovante | ✅ PASS — 1024 bytes, status success |
| 2 | JPG via CRM Chat → Code node → Agente_Comprovante | ✅ PASS — 2048 bytes, status success |
| 3 | PNG via CRM Chat → Code node → Agente_Comprovante | ✅ PASS — 1536 bytes, status success |
| 4 | JSON sem arquivo → AI Agent | ❌ FAIL — AI Agent timeout (não relacionado) |
| 5 | JSON + base64 direto ao comprovante | ✅ PASS — 1024 bytes, arquivo salvo |
| 6 | JSON-only direto ao comprovante | ✅ PASS — "arquivo_binario_ausente" |
| 7 | Arquivos persistem após restart | ✅ PASS — 19+ arquivos no disco |

**Arquivos alterados:**
- `sprint18r.js` — script de deploy + testes (NOVO)
- `docker-compose.yml` — volume `./n8n/n8n-files:/home/node/.n8n-files`
- `.ai/PROJECT_STATE.md` — documentação Sprint 1.8R
- `backup_WFCRM001chat01_v*.json` — backup pré-alteração
- `backup_WFCRM001comp01_v*.json` — backup pré-alteração

**Workflows alterados via API:**
- CRM Chat (WFCRM001chat01): HTTP Request → Code node "Enviar para Agente Comprovante" (base64), removidos 2 nodes órfãos
- Agente_Comprovante (WFCRM001comp01): VALIDAR ARQUIVO atualizado (base64 decode, 20MB limit), removidos 10 nodes órfãos
