# KLAWS CRM

Plataforma de automação operacional com CRM web, chatbot com IA, OCR de comprovantes e integração WhatsApp.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui |
| Autenticação | Supabase SSR |
| Banco | Supabase (PostgreSQL) |
| Orquestração | n8n v2.30.7 |
| OCR Local | Tesseract via microserviço HTTP (Alpine + Node.js) |
| WhatsApp | WAHA (WWebJS) |
| Chatbot | Gemini AI |
| Conteinerização | Docker Compose |

## Arquitetura

```
Cliente → WhatsApp/Web → WAHA → n8n (Master Router)
                                      │
                       ┌──────────────┼──────────────┐
                       ▼              ▼              ▼
                Agente Chat   Agente Comprovante   Agente OCR
                       │              │              │
                       ▼              ▼              ▼
                    Supabase ←── n8n ──→ OCR Service (Tesseract)
```

Cada agente é um workflow independente no n8n. O Master Router recebe todas as mensagens e roteia para o agente correto baseado no tipo de conteúdo.

## Estrutura de Pastas

```
├── .ai/                        # Documentação do projeto
│   ├── ARCHITECTURE.md         # Arquitetura oficial
│   ├── CONTRACT.md             # Regras de desenvolvimento
│   ├── PROJECT_STATE.md        # Estado atual do projeto
│   ├── LOCAL_DEVELOPMENT.md    # Guia de desenvolvimento local
│   ├── reports/                # Inventários, auditorias, planos
│   ├── review/                 # Revisões e ADRs
│   └── sprints/                # Sprints UX, INFRA
├── crm/                        # Frontend Next.js
│   ├── src/app/                # Páginas e API Routes
│   └── src/components/         # Componentes React
├── infrastructure/             # Infraestrutura Docker (canônico)
│   ├── docker-compose.yml      # Orquestração unificada
│   ├── n8n/                    # Dados persistentes do n8n
│   ├── ocr-service/            # Microserviço Tesseract
│   ├── waha/                   # Sessões WhatsApp
│   └── scripts/                # Scripts e backups
├── docker-compose.yml          # ⚠️ Depreciado — usar infrastructure/
└── sprint*.js                  # Scripts de deploy e teste legados
```

## Como Instalar

1. Clone o repositório:
   ```bash
   git clone https://github.com/your-org/klaws-crm.git
   cd klaws-crm
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp .env.example crm/.env.local
   # Edite crm/.env.local com suas chaves Supabase
   ```

3. Inicie os containers (infraestrutura unificada):
   ```bash
   cd infrastructure
   docker compose up -d
   ```

4. Acesse:
   - CRM Web: http://localhost:3001
   - n8n Editor: http://localhost:5678
   - OCR Service: http://localhost:3002/health

## Como Executar

### Containers (diretório canônico)

```powershell
cd C:\KLAWS\infrastructure

docker compose up -d                    # Iniciar todos
docker compose up -d ocr-service        # Apenas OCR
docker compose restart n8n              # Reiniciar n8n
docker compose logs n8n --tail 50       # Ver logs
docker compose build --no-cache crm     # Reconstruir CRM
docker compose up -d --force-recreate crm  # Atualizar CRM
```

### Testes do Workflow

```bash
node sprint18_final.js    # Testa Agente_Comprovante com OCR
```

### Deploy de Workflow

Os scripts `sprint*.js` realizam deploy e testes dos workflows no n8n via API.

> **Nota:** O diretório legado `C:\Users\User\Downloads\Waha N&N\` contém scripts duplicados.
> Use sempre os arquivos em `C:\KLAWS\` ou `C:\KLAWS\infrastructure\scripts\`.

## Workflows n8n

| Workflow | ID | Função |
|---|---|---|
| CRM Chat | WFCRM001chat01 | Chat web + WhatsApp, Master Router, detecção de comprovantes |
| Agente Comprovante | WFCRM001comp01 | Recebe arquivos, valida, salva, executa OCR, responde |
| WAHA Webhook | WgnQElkUjRP7f0J4 | Recebe mensagens WhatsApp e encaminha ao CRM Chat |
| Agente Comprovante (OCR) | WFCRM001ocr01 | Desativado (possuía dependência de env vars) |
| Agente Agendamento | UH5kg99biTCqPZ1F | Inativo (Telegram) |

### Pipeline do Agente Comprovante

```
Webhook → VALIDAR ARQUIVO → Valido? → TEM BINARIO? → Write Binary File
                                                          ↓
                                                   EXECUTAR OCR (Tesseract)
                                                          ↓
                                                   SALVAR OCR .TXT
                                                          ↓
                                                   Set Metadados → RESPOSTA SUCESSO
```

## Roadmap

1. ✅ Sprint 1.5 — Master Router (roteamento por tipo de arquivo)
2. ✅ Sprint 1.6 — Agente Comprovante (estrutura)
3. ✅ Sprint 1.7 — Pipeline com hash e metadados
4. ✅ Sprint 1.7R — Refatoração para nós nativos
5. ✅ Sprint 1.8R — Integração binário CRM Chat → Comprovante
6. ✅ Sprint 1.8 — OCR Local com Tesseract
7. ✅ Sprint 1.9 — Estabilização (Migration 003, WAHA, backups)
8. 🔜 Sprint 2 — Conciliação Bancária, Google Calendar

## Licença

Proprietária — Uso interno.
