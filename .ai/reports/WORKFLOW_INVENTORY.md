# WORKFLOW_INVENTORY.md
## Inventário de Workflows n8n — KLAWS CRM
**Data:** 2026-07-21
**Fonte:** n8n/data/database.sqlite (consultado via node:sqlite)

---

## RESUMO
| Total Workflows | Ativos | Inativos |
|-----------------|--------|----------|
| 2 | 1 | 1 |

---

## WORKFLOW 1: CRM Chat (Simplified Webhook)
| Campo | Valor |
|-------|-------|
| **ID** | WFCRM001chat01 |
| **Nome** | CRM Chat (Simplified Webhook) |
| **Status** | **ATIVO** (active=true) |
| **Trigger** | Webhook POST `/crm-chat` (node: "CRM Webhook") |
| **Webhook ID** | `null` (não persistido — some após restart) |
| **Response Mode** | lastNode |
| **Quantidade de Nós** | 10 |
| **Última Modificação** | 2026-07-21 18:45:32 |
| **Versão Ativa** | edc19c54-f15a-442f-b2aa-21d34c707b50 |
| **Objetivo** | Receber mensagens do frontend CRM, salvar no buffer Supabase, processar com AI Agent (Gemini), responder JSON `{text: "..."}` |

### NÓS
| Ordem | Nome | Tipo | TypeVersion | Posição | Observações |
|-------|------|------|-------------|---------|-------------|
| 1 | CRM Webhook | n8n-nodes-base.webhook | 2 | [250, 300] | path: "crm-chat", method: POST, responseMode: lastNode |
| 2 | Salvar no Buffer | n8n-nodes-base.code | 1 | [500, 300] | Usa `this.helpers.httpRequest()` para POST em Supabase message_buffer. **Workaround** para bug HTTP Request node v4.2 |
| 3 | DADOS | n8n-nodes-base.set | 3.4 | [750, 300] | Prepara payload para AI Agent (user_id, name, cargo, message, source) |
| 4 | AI Agent | @n8n/n8n-nodes-langchain.agent | 3.1 | [1000, 300] | Modelo: Google Gemini Chat Model, Memory: Simple Memory, Tools: VERIFICAR AGENDA, Criar Evento, Delete an event in Google Calendar |
| 5 | Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | 1.1 | [1000, 100] | Credencial: Google Gemini API |
| 6 | Simple Memory | @n8n/n8n-nodes-langchain.memoryBufferWindow | 1.4 | [1000, 500] | Window: 5 messages |
| 7 | VERIFICAR AGENDA | n8n-nodes-base.googleCalendarTool | 1.3 | [1250, 100] | Tool: search events |
| 8 | Criar Evento | n8n-nodes-base.googleCalendarTool | 1.3 | [1250, 300] | Tool: create event |
| 9 | Delete an event in Google Calendar | n8n-nodes-base.googleCalendarTool | 1.3 | [1250, 500] | Tool: delete event |
| 10 | Format Response | n8n-nodes-base.set | 3.4 | [1250, 700] | Output: `{ "text": "..." }` |

### CONEXÕES
```
CRM Webhook → Salvar no Buffer → DADOS → AI Agent → Format Response
                                    ↓
                              (Tools via AI Agent)
                              VERIFICAR AGENDA, Criar Evento, Delete an event
```

### GAPS vs ARCHITECTURE.md
| Arquitetura Esperada | Estado Atual |
|----------------------|--------------|
| Master Router com Switch por tipo arquivo | ❌ **Ausente** — fluxo linear único |
| Buffer obrigatório antes do Router | ✅ Existe (Salvar no Buffer) mas no fluxo linear |
| Agente OCR (comprovante) | ❌ **Não existe** — apenas config em agentes_config |
| Agente Conciliação (CTN+Extrato) | ❌ **Não existe** — apenas config em agentes_config |
| Agente Agenda (Google Calendar) | ⚠️ Parcial — tools no AI Agent, não workflow separado |
| Roteamento: Texto → Atendimento | ✅ Funciona (AI Agent atual) |
| Roteamento: Imagem/PDF → OCR | ❌ Não implementado |
| Roteamento: Planilha → Conciliação | ❌ Não implementado |

---

## WORKFLOW 2: Agente_Agendamento
| Campo | Valor |
|-------|-------|
| **ID** | UH5kg99biTCqPZ1F |
| **Nome** | Agente_Agendamento |
| **Status** | **INATIVO** (active=false) |
| **Trigger** | Telegram Trigger |
| **Quantidade de Nós** | 10 |
| **Última Modificação** | 2026-07-20 17:38:50 |
| **Objetivo** | Receber comandos via Telegram para agendar/verificar/deletar eventos no Google Calendar |

### NÓS
| Nome | Tipo | TypeVersion |
|------|------|-------------|
| Telegram Trigger | n8n-nodes-base.telegramTrigger | 1.4 |
| DADOS | n8n-nodes-base.set | 3.4 |
| AI Agent | @n8n/n8n-nodes-langchain.agent | 3.1 |
| Simple Memory | @n8n/n8n-nodes-langchain.memoryBufferWindow | 1.4 |
| Send a text message | n8n-nodes-base.telegram | 1.2 |
| Criar Evento | n8n-nodes-base.googleCalendarTool | 1.3 |
| Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | 1.1 |
| VERIFICAR AGENDA | n8n-nodes-base.googleCalendarTool | 1.3 |
| Delete an event in Google Calendar | n8n-nodes-base.googleCalendarTool | 1.3 |
| Wait | n8n-nodes-base.wait | 1.1 |

### CONEXÕES
```
Telegram Trigger → DADOS → Wait → AI Agent → Send a text message
                              ↓
                        (Tools via AI Agent)
                        VERIFICAR AGENDA, Criar Evento, Delete an event
```

### STATUS
- **Inativo** — requer ativação manual
- **Google Calendar OAuth não configurado** (redirect URI pendente no Google Cloud Console)
- Duplica funcionalidade de agenda já presente no CRM Chat

---

## WEBHOOKS REGISTRADOS
| Workflow ID | Path | Method | Node | Webhook ID |
|-------------|------|--------|------|------------|
| WFCRM001chat01 | crm-chat | POST | CRM Webhook | **null** |

> **Nota crítica:** `webhookId: null` confirma o bug conhecido do n8n 2.30.7 — webhooks sem webhookId não são registrados na inicialização do container. Requer re-toggle via API após cada restart.

---

## CREDENCIAIS REFERENCIADAS
| Tipo | Quantidade | Usado Em |
|------|------------|----------|
| Google Gemini API | 1 | CRM Chat + Agente_Agendamento |
| Google Calendar OAuth2 | 1 | CRM Chat (3 tools) + Agente_Agendamento (3 tools) |
| Telegram API | 1 | Agente_Agendamento |

---

## ARQUIVOS DE BACKUP (JSON)
Não encontrados em `n8n/data/storage/workflows/` — apenas pastas de execuções com binary_data. **Recomendação:** Exportar JSON dos workflows ativos para versionamento (conforme ARCHITECTURE.md #VERSIONAMENTO).

---

**NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.**