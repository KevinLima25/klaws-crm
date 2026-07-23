# PLANO DE REFATORAÇÃO — CRM Gateway

**Data:** 2026-07-22
**Status:** Planejamento — não implementar

---

## Objetivo

Separar o CRM Chat monolítico em:
```
CRM Gateway → Identificação de Intenção → Verificação de Permissão → Agente Especializado
```

---

## Arquitetura Proposta

### Workflow 1: CRM Gateway (novo)

```
Webhook /crm-chat
  → Salvar Buffer (Code — mantido)
  → Detectar Intenção (Code/AI — NOVO)
    ├→ agendamento → Encaminhar para Agente Agendamento
    ├→ comprovante → Encaminhar para Agente Comprovante
    ├→ conciliação → Encaminhar para Agente Conciliação (futuro)
    └→ geral → Resposta padrão
```

**Nós que permanecem:** CRM Webhook v2, Salvar no Buffer
**Nós que serão removidos:** DADOS, AI Agent, Google Gemini Chat Model, Simple Memory, VERIFICAR AGENDA, Criar Evento, Delete Calendar, Format Response
**Nós que serão movidos:** Todo o AI Agent + ferramentas + memória → Workflow 2

### Workflow 2: Agente Agendamento (novo)

```
Webhook /agendamento
  → Preparar Dados (Set — copiado do DADOS)
  → AI Agent (Gemini + Memory + Tools — copiado integralmente)
  → Format Response (Set — copiado)
```

**System Message:** Preservado integralmente (idêntico ao snapshot)
**Modelo:** `models/gemini-3.6-flash` (mantido)
**Credenciais:** Mesmas credenciais Google Calendar
**Memória:** `sessionKey = $json.ID` com contextWindow 20

### Workflow 3: CRM Chat (modificado)

Após a extração do agendamento, o CRM Chat mantém:
- Webhook (mesmo path, mesma URL)
- Buffer
- Detectar Comprovante + Master Router (comprovante/imagem/pdf/audio/video)
- **Detectar Intenção (NOVO nó Code)** — classifica a mensagem e encaminha:
  - Contém keywords de agendamento → HTTP Request → `/webhook/agendamento`
  - Contém keywords de comprovante → HTTP Request → `/webhook/comprovante` (já existe)
  - Texto geral → resposta padrão

---

## Transferência de Contexto

| Campo | Gateway → Agendamento |
|---|---|
| user_id | `={"user_id": "{{ $json.body.user_id }}", "name": "{{ $json.body.user_id }}", "message": "{{ $json.body.message }}", "date": "{{ $now.setZone('America/Sao_Paulo').format('dd-MM-yyyy HH:mm') }}"}` |
| ID | `=$json.body.user_id` |
| DATE | `=$now.setZone('America/Sao_Paulo').format('dd-MM-yyyy HH:mm')` |
| MESSAGE | `=$json.body.message` |

---

## Estratégia de Equivalência

Para validar equivalência antes/depois:

| Cenário | Validador |
|---|---|
| Consulta disponibilidade | Mesmo System Message + ferramentas → resposta equivalente |
| Sugestão de horários | 3 horários sugeridos, mesmas regras |
| Criação de agendamento | Fluxo idêntico: consulta → valida → cria → confirma |
| Cancelamento | Mesmo comportamento |
| Fora do escopo | Mesma mensagem de recusa |
| Horário ocupado | Mesma mensagem + alternativas |
| Fora do expediente | Mesma mensagem |
| Almoço | Mesma mensagem |
| Limite diário | Mesma mensagem |

---

## Plano de Rollback

1. **Exportar backup** de ambos os workflows antes da migração
2. **Manter WFCRM001chat01 original ativo** durante a migração
3. **Criar novo workflow** para Agente Agendamento em paralelo
4. **Testar novo Gateway** com webhook temporário
5. Se falhar: reativar webhook original, desativar novo
6. Rollback completo em < 2 minutos (via API deactivate/activate)

---

## Riscos

| Risco | Mitigação |
|---|---|
| Perda de memória de sessão | Manter mesmo `sessionKey = $json.ID` |
| Google Calendar OAuth expirar | Mesma credencial, não alterar |
| Divergência de resposta | Rodar testes antes/depois comparando saídas |
| Rate limit Gemini | Mesmo modelo, mesma cota |
| Webhook conflito | Usar path diferente durante testes |

---

## Arquivos que serão alterados na implementação

### Workflows n8n (via API)
- **WFCRM001chat01**: remover DADOS, AI Agent + sub-nós, Format Response
- **NOVO**: criar Agente Agendamento (com AI Agent + ferramentas)
- **NOVO**: criar Detectar Intenção Code node no CRM Chat

### Código (se necessário)
- `crm/src/components/chat-interface-v2.tsx` — alterar `N8N_WEBHOOK_URL` se necessário
- `.env.example` — documentar novo webhook URL
