# SESSÃO - CRM Klaws + n8n Automações

> Salvo em: 21/07/2026 ~18:00
> Último commit: `19be13a feat: profile page with avatar, name, email, cargo` (não commitado ainda: docker-compose.yml, database.sqlite, chat-interface-v2.tsx, crm-sidebar.tsx)

---

## 🆕 SESSÃO 2 — MCP Anti-Gravity + CDP

### 1. Configuração do MCP Anti-Gravity
**Arquivo:** `~\.config\opencode\opencode.jsonc`

- Adicionado `mcpServers.antigravity` com comando `python -m antigravity_tools.mcp.server`
- 47 ferramentas MCP registradas (agm_connect, agm_delegate_task, agm_screenshot, agm_send_prompt, agm_approve, etc.)
- Servidor usa FastMCP com transporte stdio

### 2. CDP Anti-Gravity Ativado
- Anti-Gravity IDE (v2.3.1, Electron 41, Chrome 146) iniciado com `--remote-debugging-port=9500`
- CDP respondendo em `ws://127.0.0.1:9500`
- Conexão estabelecida via `CdpClient(ports=[9500])`
- **Estado:** connected | **Workspace:** Antigravity | **Contextos:** 2

### 3. Pacote Instalado
- `antigravity-mcp-cli` v0.4.0 via pip
- CLI disponível: `python -m antigravity_tools.cli.main` (comandos: connect, doctor, delegate, send, screenshot, setup, etc.)

### ⚠️ Necessário
- **Reiniciar o opencode** para que as ferramentas MCP fiquem disponíveis ao agente

---

## 🎯 O QUE FOI FEITO NESTA SESSÃO

### 1. Supabase Migration
**Arquivo:** `crm/supabase/migrations/00003_add_comprovantes_agentes_config.sql`

3 novas tabelas:
- `comprovantes` — armazena dados extraídos via OCR (nome_pagador, razao_social, nome_fantasia, data_hora, valor, matriculas[], confidence_score, status, arquivo_url, approved_by)
- `agentes_config` — controle de permissão (cargo x agente: comprovante/conciliacao/atendimento)
- `message_buffer` — buffer de mensagens para o n8n (user_id, message, file_name, file_type, processed)

RLS policies + inserts default para todos os cargos conhecidos.

**⚠️ NÃO APLICADO AINDA** — precisa rodar no SQL Editor do Supabase.

### 2. Chat com Upload de Arquivos
**Arquivo:** `crm/src/components/chat-interface-v2.tsx` (374 linhas)

- Botão de anexo (ícone Paperclip) aceita: `.pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv`
- Preview dos arquivos selecionados (nome, tamanho, ícone, botão remover)
- Envio via `FormData` diretamente para o webhook do n8n
- Máx 5 arquivos por envio
- Sem limite de 30s (buffer agora é no n8n)

### 3. Sidebar
**Arquivo:** `crm/src/components/crm-sidebar.tsx` (245 linhas)

- Novo link "Agentes" (`/admin/agentes`) abaixo de "Usuários" na seção Administração
- Ícone Bot, visível apenas para ASSISTENTE FINANCEIRO e GERENTE

### 4. Página /admin/agentes
**Arquivo:** `crm/src/app/admin/agentes/page.tsx`

- Grid interativo cargos x agentes com switches
- 3 agentes: Comprovante (OCR), Conciliação (CTN+Extrato), Atendimento (Agendamentos)
- Botão Salvar via PUT /api/agentes-config
- Descrições dos agentes em cards

### 5. API /api/agentes-config
**Arquivo:** `crm/src/app/api/agentes-config/route.ts`

- GET: retorna todas as configs
- PUT: upsert em lote

### 6. UI Component: Switch
**Arquivo:** `crm/src/components/ui/switch.tsx`

- Componente toggle acessível (role="switch")

### 7. n8n Workflow Atualizado
**Workflow:** `WFCRM001chat01` → renomeado para `CRM Chat v2 (Master Router)`

Webhook: `/webhook/crm-chat-v2` ( `.env.local` atualizado)

Fluxo atual:
```
Webhook (POST /webhook/crm-chat-v2)
  → Salvar no Buffer (HTTP POST → Supabase message_buffer)
  → Wait (30 segundos)
  → Verificar Buffer (HTTP GET → Supabase pending messages)
  → IF (Tem mensagens?)
      ├── SIM → DADOS → AI Agent (Gemini) → Format Response
      └── NÃO → Response Vazio
```

14 nós, ativo.

---

## 🔧 PENDÊNCIAS (MANUAIS)

### A. Google Drive OAuth no n8n
**Problema:** Autorização no Google retorna "Unauthorized" após redirect.
**Causa provável:** Redirect URI errada no Google Cloud Console ou Drive API não habilitada.

**Solução (exata):**
1. Acessar https://console.cloud.google.com/apis/credentials
2. No OAuth Client ID, Authorized redirect URIs deve conter:
   ```
   http://127.0.0.1:5678/rest/oauth2-credential/callback
   ```
3. Acessar https://console.cloud.google.com/apis/library/drive.googleapis.com e clicar "Enable"
4. Em "OAuth consent screen" > "Scopes", adicionar:
   ```
   https://www.googleapis.com/auth/drive.file
   ```
5. Recriar a credential no n8n com Client ID e Secret corretos

### B. Roteamento por tipo de arquivo no workflow mestre
Entre o nó "Tem mensagens?" (true branch) e "DADOS", adicionar um **Switch** no n8n:

```
Tem mensagens? (true)
  → Switch (tipo de arquivo)
    ├── Imagem/PDF → Execute Workflow "Agente Comprovante"
    ├── XLS/XLSX/CSV → Execute Workflow "Agente Conciliação"
    └── Sem arquivo (texto) → DADOS → AI Agent (Atendimento)
```

### C. Criar "Agente Comprovante (OCR)"
Workflow separado no n8n:
1. Webhook (POST /webhook/agent-comprovante)
2. Extrair binary file do webhook
3. HTTP Request → OCR.space (POST /parse/image)
   - apikey: `K842936267889572`
   - file: binary do webhook
   - language: por
4. Code node: parsear resposta do OCR
5. IF (confidence >= 80%)
   - SIM → Salvar em Supabase `comprovantes` + Google Drive
   - NÃO → Notificar assistente financeiro
6. Responder ao usuário

### D. Criar "Agente Conciliação (CTN + Extrato)"
Workflow separado no n8n:
1. Webhook (POST /webhook/agent-conciliacao)
2. Parse CSV/XLS
3. Match matrículas com `comprovantes` no Supabase
4. Validar soma dos valores
5. Cruzar com extrato bancário
6. Gerar alertas de divergência

### E. Aplicar Migration no Supabase
Acessar https://supabase.com → SQL Editor → colar conteúdo de:
`crm/supabase/migrations/00003_add_comprovantes_agentes_config.sql`

### F. Supabase Credentials no n8n
Os nós HTTP Request que acessam o Supabase usam `noAuth` com headers.
Idealmente criar uma credential "Supabase API" no n8n com a Service Role Key:
```
URL: https://wbmljquydsatacqerlzv.supabase.co
Service Key: SUPABASE_SERVICE_ROLE_KEY_REMOVED
```

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### Modificados:
- `crm/src/components/chat-interface-v2.tsx`
- `crm/src/components/crm-sidebar.tsx`
- `crm/.env.local`

### Novos:
- `crm/supabase/migrations/00003_add_comprovantes_agentes_config.sql`
- `crm/src/app/admin/agentes/page.tsx`
- `crm/src/app/api/agentes-config/route.ts`
- `crm/src/components/ui/switch.tsx`

### n8n:
- Workflow `WFCRM001chat01` atualizado para "CRM Chat v2 (Master Router)"
- `n8n/data/database.sqlite` modificado

---

## 🔗 REFERÊNCIAS

- **OCR.space API Key:** `K842936267889572`
- **Supabase URL:** `https://wbmljquydsatacqerlzv.supabase.co`
- **Supabase Service Key:** `SUPABASE_SERVICE_ROLE_KEY_REMOVED`
- **n8n Webhook:** `http://localhost:5678/webhook/crm-chat-v2`
- **n8n API Key:** presente no DB em `user_api_keys`
- **Google Calendar ID:** `bcf86a98555aca85102397efdec3a8ee706c125c80979ddaab384b6488847029@group.calendar.google.com`
- **Gemini API:** credential `SHCrSearl3r2JwZp`

---

## 🆕 SESSÃO 3 — Automatizado via API

### 1. Switch de Roteamento Adicionado
**Workflow:** `CRM Chat v2 (Master Router)` (`WFCRM001chat01`)

Fluxo atual:
```
Webhook (POST /webhook/crm-chat-v2)
  → Salvar no Buffer (HTTP POST → Supabase message_buffer)
  → Wait (30 segundos)
  → Verificar Buffer (HTTP GET → Supabase pending messages)
  → IF (Tem mensagens?)
      ├── SIM → Switch Tipo de Arquivo
      │   ├── Imagem/PDF → HTTP POST /webhook/agent-comprovante → Format Response
      │   ├── Planilha (XLS/CSV) → HTTP POST /webhook/agent-conciliacao → Format Response
      │   └── Texto → DADOS → AI Agent (Gemini) → Format Response
      └── NÃO → Response Vazio
```

### 2. Agente Comprovante (OCR) — Ativo
**Workflow:** `Agente Comprovante (OCR)` (`ivosTI7y7qf3FiUL`)

Webhook: `/webhook/agent-comprovante`
Fluxo:
```
Webhook → OCR.space Request (API Key: K842936267889572)
  → Parse OCR Response (Code node)
  → IF (confidence >= 80%)
      ├── SIM → Format Response (sucesso)
      └── NÃO → Format Response (confiança baixa)
```

### 3. Agente Conciliação (CTN + Extrato) — Ativo
**Workflow:** `Agente Conciliação (CTN + Extrato)` (`r5P3kyKDabvVg03u`)

Webhook: `/webhook/agent-conciliacao`
Fluxo:
```
Webhook → Parse CSV/XLS (Code node)
  → Buscar Comprovantes (HTTP GET → Supabase comprovantes)
  → Matcher & Validação (Code node: cruza matrículas, valida valores)
  → Format Response (divergências ou "tudo ok")
```

### 4. Migration SQL — Pendente
A migration `00003_add_comprovantes_agentes_config.sql` precisa ser aplicada manualmente no SQL Editor do Supabase:
https://supabase.com → SQL Editor → colar conteúdo de `crm/supabase/migrations/00003_add_comprovantes_agentes_config.sql`



---

## ⚠️ CORREÇÃO — SESSÃO 3 (Não Persistiu no DB)

As informações abaixo refletem o que foi **planejado/editado via script** na Sessão 3, mas **não persistiram no banco SQLite** — seja por erro de versão, rollback, ou perda de dados:

| Item | Planejado (Sessão 3) | Realidade Atual |
|---|---|---|
| Switch de Roteamento | Adicionado ao workflow mestre | ❌ **Ausente** — workflow é linear |
| Agente Comprovante (OCR) | Workflow `ivosTI7y7qf3FiUL` ativo | ❌ **Não existe** no `workflow_entity` |
| Agente Conciliação (CTN+Extrato) | Workflow `r5P3kyKDabvVg03u` ativo | ❌ **Não existe** no `workflow_entity` |
| Próximos passos marcados ✅ | 4 itens marcados como concluídos | ❌ Nenhum deles foi concluído de fato |

Os IDs `ivosTI7y7qf3FiUL` e `r5P3kyKDabvVg03u` não constam em `workflow_entity` nem em `workflow_history`. Restam apenas 2 workflows no banco:
- `UH5kg99biTCqPZ1F` → **Agente_Agendamento** (inativo)
- `WFCRM001chat01` → **CRM Chat (Simplified Webhook)** (ativo)

---

## 🆕 SESSÃO 4 — Debug, Workaround e Simplificação

### 1. Descoberta: HTTP Request Node Bug
O nó `HTTP Request` (typeVersion 4.2) apresenta **TypeError sistêmico** em `HttpRequestV3.node.ts:849` em todo POST/PUT com `sendBody:true`. O erro ocorre independente de URL ou payload.

**Workaround:** Substituir por **Code node** com `this.helpers.httpRequest()` — API interna do n8n que faz a chamada HTTP sem passar pelo nó bugado.

### 2. Workflow Simplificado
**Workflow:** `CRM Chat (Simplified Webhook)` (`WFCRM001chat01`)

Fluxo **atual** (simplificado, sem Wait/IF/Switch):
```
Webhook (POST /webhook/crm-chat)
  → Salvar no Buffer (Code node → Supabase message_buffer)
  → DADOS (Set node → prepara dados)
  → AI Agent (Gemini + Google Calendar tools + Memory)
  → Format Response (Set node → { "text": "..." })
```
- **10 nós** (era 14)
- **Wait de 30s removido** — causava timeout na resposta
- **Salvar no Buffer via Code node** — bypass do bug do HTTP Request
- **Response diretamente do AI Agent** — sem buffer/router

### 3. Webhook Path Alterado
| Antes | Depois | Motivo |
|---|---|---|
| `/webhook/crm-chat-v2` | `/webhook/crm-chat` | Simplicidade; remover sufixo de versão |

### 4. Descoberta: Webhook Não Persiste Pós-Restart
No n8n 2.30.7, webhooks **sem `webhookId`** não são registrados no Express após `docker compose restart n8n`. A rota `/webhook/crm-chat` retorna **404** até que o workflow seja togglado via API.

**Solução:** Script `toggle_webhook.js` que chama a API REST para deactivate/activate o workflow, re-registrando a rota. Necessário body `{}` (mesmo vazio).

### 5. Scripts Criados
| Arquivo | Função |
|---|---|
| `toggle_webhook.js` | Toggle via API n8n (deactivate + activate com body `{}`) — re-registra webhook pós-restart |
| `restart_n8n.bat` | Docker compose restart + aguarda 15s + executa toggle |
| `STATUS.md` | Documentação do status atual do fluxo |

### 6. docker-compose.yml: WEBHOOK_URL → N8N_WEBHOOK_URL
| Antes | Depois |
|---|---|
| `WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/` | `N8N_WEBHOOK_URL=http://localhost:5678/` |

- `WEBHOOK_URL` é **depreciada** no n8n 2.30.7
- `N8N_WEBHOOK_URL` é o formato oficial
- Removido ngrok (não está mais em uso)

### 7. Frontend: File Upload + FormData
**Arquivo:** `crm/src/components/chat-interface-v2.tsx`

- Adicionado campo `cargo` no FormData
- Botão **Paperclip** para anexar arquivos (PDF, imagens, planilhas)
- Preview dos arquivos com nome, tamanho, ícone e botão remover
- Máx 5 arquivos
- Envio agora usa **FormData** (antes era JSON)
- Só salva resposta do bot no Supabase se houver reply não-vazio

### 8. Sidebar: Link "Agentes"
**Arquivo:** `crm/src/components/crm-sidebar.tsx`

- Novo link `/admin/agentes` com ícone Bot na seção Administração
- Visível apenas para ASSISTENTE FINANCEIRO e GERENTE

---

## 💡 PRÓXIMOS PASSOS (ordem sugerida)

1. 🔴 **Aplicar migration SQL no Supabase** (manual — necessário para as tabelas `comprovantes`, `agentes_config`, `message_buffer`)
2. 🔴 Configurar Google Drive OAuth no n8n (redirect URI no Google Cloud Console)
3. 🔴 Criar **Agente Comprovante (OCR)** — webhook `/webhook/agent-comprovante`
4. 🔴 Criar **Agente Conciliação (CTN+Extrato)** — webhook `/webhook/agent-conciliacao`
5. 🟡 Reimplementar **Switch de roteamento** no workflow mestre
6. 🟡 Automatizar **toggle webhook** no startup do container (healthcheck ou entrypoint)
7. 🟡 Mover credenciais (n8n API Key, Supabase Service Key) para env vars / secrets

---

## 📝 OBSERVAÇÕES
- Os dados da planilha `baixa_ctn.xlsx` estão em Sheet "BaixaDiaria", colunas: Matrícula (B), Nome (D), Forma Arrecadação (G), Mês Ref. (H), DT. Baixa (J), VL. Baixa (K), Login (L)
- O `extrato.csv` tem colunas: Data de transferência; Tipo; Descrição; ID da transação; Valor
- O n8n Agenda_Agendamento (Telegram, ID: UH5kg99biTCqPZ1F) está inativo
