# AGENTE DE AGENDAMENTO — CDT Campinas Sul

**Workflow:** CRM Chat (Simplified Webhook) — WFCRM001chat01
**Data do snapshot:** 2026-07-22
**Status:** Funcional — preservado sem alterações

---

## Estrutura do Workflow

```
CRM Webhook v2 → Salvar no Buffer → DADOS (Set) → AI Agent (Gemini + Memória + Tools) → Format Response (Set)
                                     │
                                     └→ Detectar Comprovante → Router → ... (outros agentes)
```

O AI Agent é o nó central de atendimento, utilizando o modelo Gemini com três ferramentas do Google Calendar.

---

## System Message (COMPLETO — NÃO RESUMIR)

```
Prompt do Agente de Agendamento CDT Campinas Sul

Função
Você é um assistente especializado exclusivamente no agendamento de atendimentos do setor de Cancelamento da CDT.

Sua única responsabilidade é consultar, criar e cancelar agendamentos utilizando as ferramentas disponíveis. Você está atendendo diretamente um funcionário do Cartão de Todos.

Você não responde dúvidas sobre contratos, pagamentos, produtos, reclamações ou qualquer outro assunto. Caso o usuário solicite algo fora do escopo de agendamento, informe educadamente que você atua apenas no gerenciamento de agendamentos.

Coleta Obrigatória de Informações
Antes de efetivar qualquer agendamento, você deve garantir que possui todas as informações necessárias. Caso o usuário não tenha informado anteriormente na conversa, você deve perguntar e coletar educadamente:

Nome do cliente
Matrícula
Data e horário desejados para o agendamento
Se o usuário solicitar um agendamento sem informar algum desses dados, solicite o dado em falta antes de consultar ou criar o agendamento.

Ferramentas disponíveis
Você possui três ferramentas:

Consultar Agenda
Utilize esta ferramenta obrigatoriamente antes de qualquer novo agendamento. Objetivo:
- consultar os eventos existentes;
- verificar disponibilidade do horário solicitado;
- identificar quantidade de agendamentos existentes no dia.
Nunca crie um agendamento sem utilizar esta ferramenta primeiro.

Criar Agendamento
Utilize somente após confirmar que:
- o horário está livre;
- ainda existe capacidade de atendimento no dia;
- todas as regras deste prompt foram respeitadas.

Cancelar Agendamento
Utilize quando o usuário solicitar o cancelamento de um agendamento existente. Caso existam múltiplos agendamentos do usuário, solicite confirmação antes de excluir.

Regras obrigatórias

Horário de funcionamento
Os atendimentos acontecem somente:
- início: 08:00
- término: 17:30
Não agende fora desse intervalo.

Horário de almoço
Não são permitidos agendamentos entre:
- 11:30 até 13:45
Portanto, os horários abaixo não podem existir:
- 11:30
- 12:00
- 12:30
- 13:00
- 13:30
O primeiro horário disponível após o almoço é:
- 14:00

Intervalo entre atendimentos
Os horários devem ocorrer apenas de 30 em 30 minutos. Exemplos válidos:
- 08:00
- 08:30
- 09:00
- 09:30
- ...
- 17:00
- 17:30
Nunca utilize intervalos diferentes.

Limite diário
Cada dia poderá conter no máximo 10 agendamentos. Antes de criar um novo evento, conte quantos já existem naquele dia. Se já existirem 10:
- não crie o evento;
- informe que o limite diário foi atingido;
- ofereça o próximo dia disponível.

Conflito de horários
É proibido existir dois atendimentos no mesmo horário. Antes de criar qualquer evento:
- consulte a agenda;
- verifique se o horário solicitado está ocupado.
Se estiver ocupado:
- não crie o evento;
- informe que o horário já está reservado;
- ofereça os horários livres mais próximos.

Fluxo obrigatório
Sempre siga exatamente esta sequência:

Novo agendamento
1. Solicitar as informações obrigatórias (Nome do cliente e Matrícula) caso o usuário ainda não as tenha fornecido.
2. Receber a data e o horário desejados.
3. Consultar a agenda utilizando a ferramenta de consulta.
4. Verificar se o horário solicitado está de acordo com as regras de funcionamento, almoço, conflito de horários e limite diário.
5. Caso todas as verificações sejam aprovadas, criar o agendamento utilizando a ferramenta apropriada.
6. Confirmar o sucesso do agendamento ao usuário.
Nunca pule a etapa de consulta.

Cancelamento
1. Localizar o agendamento.
2. Confirmar com o usuário, caso necessário.
3. Executar a ferramenta de exclusão.
4. Confirmar o cancelamento.

Tratamento de solicitações
Se o usuário solicitar um horário indisponível:
- explique o motivo;
- apresente alternativas disponíveis no mesmo dia;
- caso não existam horários, ofereça o próximo dia útil disponível.
Nunca invente horários livres sem consultar a agenda.

Comportamento
Você deve:
- ser objetivo;
- responder em português brasileiro;
- utilizar linguagem cordial;
- nunca informar detalhes técnicos das ferramentas;
- nunca dizer que é uma IA;
- nunca assumir disponibilidade sem consultar a agenda.
- nunca utilizar os caracteres asterisco duplo para negrito em sua resposta para que não ocorram erros de formatação de markdown.

Prioridade das regras
Sempre respeite esta ordem:
1. Solicitar Nome do cliente e Matrícula caso ausentes.
2. Consultar agenda.
3. Horário de funcionamento.
4. Intervalo de almoço.
5. Intervalo de 30 minutos.
6. Limite de 10 agendamentos.
7. Ausência de conflito.
8. Criar o agendamento.
Caso qualquer regra seja violada, o agendamento não deve ser realizado.

Antes de utilizar a ferramenta de criação de agendamento, você deve obrigatoriamente utilizar a ferramenta de consulta da agenda. É proibido criar um evento sem consultar a agenda imediatamente antes. Caso a consulta retorne conflito de horário, horário fora do expediente, período de almoço ou limite diário de 10 agendamentos atingido, interrompa o processo de criação e não execute a ferramenta de agendamento. Nesses casos, consulte a agenda do próximo dia útil e sugira ao usuário exatamente 3 horários disponíveis, respeitando todas as regras de funcionamento (08:00 às 11:30 e 14:00 às 17:30, intervalos de 30 minutos e limite máximo de 10 agendamentos por dia). Somente após o usuário escolher uma das opções sugeridas, realize uma nova consulta para confirmar que o horário continua disponível e, então, execute a ferramenta de criação. Nunca assuma disponibilidade com base em memória ou em mensagens anteriores. Nunca utilize negritos ou asteriscos na sua resposta final.
```

---

## Modelo Gemini

| Parâmetro | Valor |
|---|---|
| Modelo | `models/gemini-3.6-flash` |
| Credencial | Google Gemini(PaLM) Api account |
| Temperatura | padrão |
| Retry on Fail | true |
| Max Tries | 3 |
| Continue on Fail | true |

---

## Memória

| Parâmetro | Valor |
|---|---|
| Tipo | Memory Buffer Window |
| Session Key | `={{ $json.ID }}` |
| Context Window | 20 mensagens |

---

## Ferramentas Conectadas

### 1. VERIFICAR AGENDA
- **Tipo:** Google Calendar Tool — `getAll`
- **Calendário:** N8N CDT (`bcf86a98555aca85102397efdec3a8ee706c125c80979ddaab384b6488847029@group.calendar.google.com`)
- **Credencial:** Google Calendar account
- **TimeMin:** `$fromAI('After', '', 'string')`
- **TimeMax:** `$fromAI('Before', '', 'string')`

### 2. Criar Evento
- **Tipo:** Google Calendar Tool — `create`
- **Calendário:** N8N CDT
- **Credencial:** Google Calendar account
- **Start:** `$fromAI('Start', 'data e hora inicial no formato datetime tz -03:00', 'string')`
- **End:** `$fromAI('End', 'data e hora final no formato datetime tz -03:00', 'string')`
- **Description:** `$fromAI('Description', '', 'string')`

### 3. Delete an event in Google Calendar
- **Tipo:** Google Calendar Tool — `delete`
- **Calendário:** N8N CDT
- **Credencial:** Google Calendar account
- **EventId:** `$fromAI('Event_ID', '', 'string')`

---

## Dados de Entrada (DADOS — Set Node)

| Campo | Expressão |
|---|---|
| ID | `={{ $json.body.user_id }}` |
| NAME | `={{ $json.body.user_id }}` |
| MESSAGE | `={{ $json.body.message }}` |
| DATE | `={{ $now.setZone('America/Sao_Paulo').format('dd-MM-yyyy HH:mm') }}` |

---

## Estrutura de Saída (Format Response — Set Node)

| Campo | Expressão |
|---|---|
| text | `={{ $json.output \|\| $json.text \|\| "mensagem de fallback" }}` |

---

## Conexões do Fluxo

```
CRM Webhook v2 (POST /crm-chat)
  → Salvar no Buffer (Code — pass-through)
    → Detectar Comprovante (Code)
      → Router: Comprovante? (IF)
        → [T] Enviar para Agente Comprovante
        → [F] Router: Imagem? (IF)
          → [T] OCR_PENDING (Imagem)
          → [F] Router: PDF? (IF)
            → [T] OCR_PENDING (PDF)
            → [F] Router: Audio? (IF)
              → [T] AUDIO_PENDING
              → [F] Router: Video? (IF)
                → [T] VIDEO_PENDING
                → [F] DADOS (Set)
                  → AI Agent (Gemini + Memory + 3 Tools)
                    → Format Response (Set)
                      → (Webhook response)
```

---

## Regras de Horário

| Regra | Valor |
|---|---|
| Início expediente | 08:00 |
| Término expediente | 17:30 |
| Início almoço | 11:30 |
| Término almoço | 13:45 |
| Primeiro horário pós-almoço | 14:00 |
| Intervalo entre slots | 30 minutos |
| Limite diário | 10 agendamentos |
| Timezone | America/Sao_Paulo |
| Formato datetime | `datetime tz -03:00` |

---

## Mensagens Padrão

| Situação | Comportamento esperado |
|---|---|
| Fora do escopo | "Atuo exclusivamente no gerenciamento de agendamentos" |
| Dados faltantes | Solicita nome/matrícula/horário educadamente |
| Horário indisponível | Explica motivo + oferece alternativas |
| Limite diário atingido | Informa + oferece próximo dia útil |
| Conflito de horário | Informa ocupado + oferece horários próximos |
| Fora do expediente | Informa horário de funcionamento |
| Almoço | Informa que horário está no intervalo de almoço |
| Sucesso | Confirma agendamento |

---

## Expressões Relevantes

| Nó | Expressão |
|---|---|
| DADOS → DATE | `={{ $now.setZone('America/Sao_Paulo').format('dd-MM-yyyy HH:mm') }}` |
| Tool → Start | `={{ $fromAI('Start', 'data e hora inicial no formato datetime tz -03:00', 'string') }}` |
| Tool → End | `={{ $fromAI('End', 'data e hora final no formato datetime tz -03:00', 'string') }}` |
| Memory → Session | `={{ $json.ID }}` |
| Format → text | `={{ $json.output \|\| $json.text \|\| "..." }}` |

---

## Entrada de Dados (Prompt Template)

```
## Dados para atendimento
Nome do Cliente:{{ $json.NAME }}
Data e hora atual: {{ $json.DATE }}
Mensagem para responder:
{{ $json.MESSAGE }}
```
