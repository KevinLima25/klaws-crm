# KLAWS CRM — Riscos, Dívida Técnica e Melhorias

## Riscos (Possíveis Problemas em Produção)

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| **Google Calendar OAuth não configurado** | AI Agent não consegue criar/verificar/deletar eventos | Alta | Pendente — redirect URI precisa ser registrada no Google Cloud Console |
| **Gemini AI rate limiting** | Workflows que usam AI Agent podem falhar intermitentemente | Média | Retry nodes no n8n podem ser configurados |
| **WAHA sessão não autenticada** | Mensagens WhatsApp não são recebidas | Alta (até scan QR) | Pendente — scan manual do QR code via WAHA Dashboard |
| **n8n webhookId=null** | Webhooks podem parar de funcionar após restart | Média | Path-based webhooks funcionam na prática; reativar workflow se necessário |
| **Secrets hardcoded no docker-compose.yml** | N8N_ENCRYPTION_KEY, WAHA_API_KEY expostos no versionamento | Alta | Pendente — mover para Docker Secrets ou .env não versionado |
| **Migration 003 não aplicada (parcial)** | agentes_config tem dados, message_buffer pode não ter RLS | Baixa | Migration contém INSERTs que já foram executados (duplicatas ignoradas por ON CONFLICT) |

## Dívida Técnica

| Item | Descrição | Prioridade |
|---|---|---|
| **Sem testes E2E para fluxo chat** | Apenas `login.spec.ts` existe | Média |
| **Scripts de debug na raiz** | ~10 scripts `.js` na raiz do projeto | Baixa |
| **Sem tratamento de erro no Code node** | Code node "Salvar no Buffer" não trata falha | Média |
| **n8n rodando sem healthcheck** | Docker compose sem healthcheck | Baixa |
| **WAHA Dashboard credentials versionadas** | Username/password em texto puro no docker-compose | Alta |
| **Frontend monolítico** | `chat-interface-v2.tsx` com 374 linhas | Baixa |

## Melhorias Futuras

| Melhoria | Benefício |
|---|---|
| Autenticar WAHA session (scan QR code) | Ativar recebimento de mensagens WhatsApp |
| Configurar Google Calendar OAuth | AI Agent pode gerenciar agenda |
| Mover credenciais para Docker Secrets | Segurança |
| Adicionar healthchecks nos containers | Monitoramento |
| Implementar Agente Conciliação | Fluxo completo de conciliação bancária |
| Migrar para HTTP Request node (quando bug for corrigido) | Consistência visual do workflow |
