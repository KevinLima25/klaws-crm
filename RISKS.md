# RISKS — Riscos, Dívida Técnica e Melhorias

## Riscos (Possíveis Problemas em Produção)

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| **Webhook não persiste pós-restart** | Chat fica offline até re-toggle manual | Alta (100% dos restart) | `toggle_webhook.js` + `restart_n8n.bat` criados como workaround. Pendente: script no entrypoint do container |
| **HTTP Request node v4.2 com TypeError** | Não é possível usar HTTP Request node para POST/PUT com `sendBody:true` | Alta | Workaround com Code node + `this.helpers.httpRequest()`. Limita uso de nós visuais |
| **Migration SQL não aplicada** | `message_buffer`, `comprovantes`, `agentes_config` não existem no Supabase | Alta | Pendente — depende de ação manual |
| **n8n API Key exposta no `toggle_webhook.js`** | Qualquer um com acesso ao código pode chamar a API do n8n | Média | Chave está no DB (`user_api_keys`). Ideal: mover para env var do container |
| **Google Calendar OAuth não configurado** | AI Agent não consegue criar/verificar/deletar eventos | Alta | Pendente — redirect URI precisa ser registrada no Google Cloud Console |
| **ngrok.exe no repositório** | Executável binário versionado (6.5MB) | Baixa | Deveria estar em `.gitignore` ou em path separado |

## Dívida Técnica

| Item | Descrição | Prioridade |
|---|---|---|
| **Workflow linear sem router** | O workflow mestre não implementa Switch de arquivo. Agentes Comprovante e Conciliação nem existem | Alta |
| **Sem testes E2E para fluxo chat** | Apenas `login.spec.ts` existe. Fluxo de envio de mensagem não é testado | Média |
| **Credenciais hardcoded** | Supabase Service Key, n8n API Key, OCR.space API Key estão em texto puro em arquivos | Alta |
| **Scripts de debug poluindo raiz** | ~40+ scripts `.js` avulsos na raiz do projeto de debug do n8n | Baixa |
| **Sem tratamento de erro no Code node** | O Code node "Salvar no Buffer" não trata falha da requisição HTTP | Média |
| **n8n rodando sem healthcheck** | Docker compose não tem healthcheck para o n8n; `toggle_webhook.js` faz polling manual | Baixa |

## Melhorias Futuras

| Melhoria | Benefício |
|---|---|
| Criar entrypoint script no container n8n que faz toggle automático no startup | Elimina passo manual pós-restart |
| Migrar do Code node para HTTP Request node (quando bug for corrigido) | Preserva consistência visual do workflow |
| Adicionar testes E2E com Playwright para fluxo chat | Detecção precoce de regressão |
| Mover credenciais para secrets do Docker ou Supabase Vault | Segurança |
| Implementar Agente Comprovante (OCR) + Agente Conciliação (CTN+Extrato) | Fluxo completo de automação |
| Aplicar migration SQL no Supabase | Tabelas necessárias para buffer e comprovantes |

## Código que Merece Refatoração

| Arquivo | Problema | Sugestão |
|---|---|---|
| `chat-interface-v2.tsx` | 374 linhas, lógica de API + estado + UI misturados | Extrair hooks `useChat`, `useFileUpload` |
| `toggle_webhook.js` | n8n API Key hardcoded | Ler de env var `N8N_API_KEY` |
| `fix_*.js` / `check_*.js` (40+ scripts) | Código duplicado de debugging | Manter apenas os essenciais; remover após estabilização |
