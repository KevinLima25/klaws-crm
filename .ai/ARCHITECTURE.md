# KLAWS CRM
## ARCHITECTURE.md
Versão: 1.0

---

# OBJETIVO

Este documento define a arquitetura oficial do KLAWS CRM.

Todas as IAs devem seguir estas regras obrigatoriamente.

Caso qualquer Sprint entre em conflito com este documento, a IA deve interromper a implementação e solicitar esclarecimentos.

Este documento representa a arquitetura oficial do sistema.

---

# VISÃO GERAL

O KLAWS CRM é uma plataforma de automação operacional composta por:

- CRM Web
- n8n
- Supabase
- Google Calendar
- Google Drive
- Playwright
- MCP AntiGravity
- WAHA
- Telegram
- IA (Gemini/OpenAI futuramente)

A arquitetura foi projetada para ser modular.

Cada domínio possui responsabilidade única.

---

# PRINCÍPIOS

A arquitetura segue cinco princípios.

## 1

Fonte única da verdade.

## 2

Baixo acoplamento.

## 3

Alta rastreabilidade.

## 4

Modularização.

## 5

Automações independentes.

---

# RESPONSABILIDADES

## Frontend

Responsável apenas por:

- interface
- autenticação
- dashboard
- chat
- formulários
- administração

O Frontend NÃO implementa regras de negócio.

---

## Supabase

É a única fonte oficial dos dados.

Toda informação persistente deve existir no Supabase.

Exemplos:

- usuários
- comprovantes
- buffer
- configurações
- permissões
- dashboards
- agendamentos
- métricas

Nunca utilizar Google Sheets como banco principal.

Google Sheets somente para importações temporárias.

---

## n8n

O n8n NÃO é banco de dados.

O n8n NÃO é fonte de verdade.

O n8n é apenas o orquestrador dos fluxos.

Toda informação importante deve ser persistida no Supabase.

---

## Dashboard

O Dashboard nunca deve depender de workflows.

Ele deve consumir dados do Supabase.

Preferencialmente através de:

- Views
- APIs
- Procedures

Nunca consultar tabelas críticas diretamente quando houver uma camada intermediária disponível.

---

# DOMÍNIOS

O sistema é dividido em domínios.

Cada Sprint deve alterar apenas um domínio.

## Frontend

React

Next.js

Shadcn

---

## Banco

Supabase

Migrations

Policies

Views

---

## Automações

n8n

---

## OCR

OCR.space

Playwright

---

## Agenda

Google Calendar

---

## Arquivos

Google Drive

---

## Comunicação

WhatsApp (WAHA)

Telegram

Chat Web

---

## Integrações

Power BI

Playwright

APIs externas

---

# WORKFLOWS

Cada workflow possui responsabilidade única.

Nunca criar workflows gigantes.

Sempre separar responsabilidades.

Exemplo:

CRM Chat

↓

Master Router

↓

Agente Atendimento

↓

Agente OCR

↓

Agente Conciliação

↓

Agenda

↓

Notificações

---

Cada agente deve possuir workflow próprio.

Nunca misturar OCR com Atendimento.

Nunca misturar Agenda com Conciliação.

---

# MASTER ROUTER

O Master Router é o ponto único de entrada das mensagens.

Responsabilidades:

- receber mensagens
- identificar origem
- identificar anexos
- identificar tipo de arquivo
- encaminhar ao agente correto

O Master Router nunca executa OCR.

Nunca executa conciliação.

Nunca executa agenda.

Ele apenas roteia.

---

# AGENTES

Cada agente é independente.

## Atendimento

Responsável por:

- conversa
- agendamentos
- dúvidas

---

## OCR

Responsável por:

- leitura de comprovantes
- validação
- extração

---

## Conciliação

Responsável por:

- extrato bancário
- CTN
- cruzamentos
- divergências

---

## Agenda

Responsável por:

Google Calendar

confirmações

cancelamentos

reagendamentos

---

# BUFFER

Toda mensagem recebida deve passar pelo buffer.

Fluxo:

Cliente

↓

Buffer

↓

Router

↓

Agente

↓

Resposta

Nunca enviar diretamente para IA.

---

# BANCO

Nunca editar migrations existentes.

Toda alteração estrutural deve gerar nova migration.

Nunca remover colunas.

Nunca remover tabelas.

Nunca alterar RLS existentes sem autorização.

---

# FRONTEND

O frontend nunca implementa lógica crítica.

Toda regra de negócio pertence:

- API
- n8n
- Supabase

---

# SEGURANÇA

Nunca expor:

Service Role

API Keys

OAuth

Tokens

JWT

Secrets

---

# CREDENCIAIS

Toda credencial deve utilizar:

- Environment Variables
- Docker Secrets
- Secret Manager

Nunca hardcode.

---

# APIs

Toda integração deve passar por APIs.

Nunca acessar serviços externos diretamente da interface.

---

# PLAYWRIGHT

Playwright é utilizado apenas para automação.

Nunca para persistência.

Nunca para regras de negócio.

---

# MCP

Os MCPs são ferramentas.

Não representam regras do sistema.

São apenas meios para executar tarefas.

---

# DASHBOARD

Toda informação do dashboard deve ser derivada do banco.

Nunca calcular indicadores na interface.

Indicadores devem ser produzidos por:

Views

Procedures

Consultas SQL

---

# GOOGLE SHEETS

Google Sheets possui uso temporário.

Permitido apenas para:

importações

exportações

auditorias

Nunca utilizar como banco principal.

---

# GOOGLE CALENDAR

É a fonte oficial da agenda.

O Supabase armazena apenas metadados.

Nunca duplicar agenda.

---

# GOOGLE DRIVE

Armazena documentos.

Nunca utilizar Drive como banco de dados.

---

# VERSIONAMENTO

Todo workflow deve possuir backup JSON.

Todo workflow deve possuir documentação.

Nunca depender exclusivamente do SQLite do n8n.

---

# LOGS

Toda automação deve produzir logs.

Sempre registrar:

entrada

processamento

resultado

erro

tempo de execução

---

# ESCALABILIDADE

Toda nova funcionalidade deve ser criada como módulo independente.

Evitar dependências cruzadas.

---

# TESTES

Toda Sprint deve conter:

testes realizados

testes pendentes

riscos

impacto

---

# REGRA DE ALTERAÇÃO

Uma Sprint deve alterar apenas um domínio.

Exemplos:

✔ Frontend

✔ Banco

✔ OCR

✔ Dashboard

✔ Agenda

✔ Router

Nunca alterar múltiplos domínios na mesma Sprint sem autorização.

---

# RECUPERAÇÃO

Antes de qualquer alteração em workflows:

Exportar JSON.

Antes de qualquer migration:

Backup.

Antes de qualquer refatoração:

Commit.

---

# FILOSOFIA

A estabilidade possui prioridade sobre velocidade.

Uma implementação simples e segura é preferível a uma implementação complexa.

Todo código deve ser previsível.

Toda automação deve ser rastreável.

Toda integração deve ser documentada.

Toda Sprint deve ser pequena.

---

# ESTADO FUTURO DA ARQUITETURA

Arquitetura alvo:

Frontend (Next.js)

↓

API

↓

Supabase

↓

n8n (Orquestração)

↓

Agentes

↓

Integrações Externas

↓

Google Calendar

Google Drive

OCR

WAHA

Telegram

Power BI

---

Este documento é a referência oficial da arquitetura do KLAWS CRM.

Nenhuma IA pode tomar decisões arquiteturais diferentes sem autorização explícita.