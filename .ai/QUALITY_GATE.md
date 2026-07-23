# QUALITY GATE — KLAWS CRM

## Checklist obrigatório entre Sprints

| # | Item | Como verificar | Critério |
|---|---|---|---|---|
| 1 | **Build** | `npm run build` | 0 TypeScript errors, todas as páginas compilam |
| 2 | **Lint** | `npm run lint` | Erros pré-existentes tolerados; novos erros bloqueiam |
| 3 | **Secret scan** | `git diff --cached` ou `Select-String` por credenciais | Nenhuma chave/secret/token versionado |
| 4 | **Responsividade** | Testar sidebar, overflow, touch targets | Navegação funcional em mobile viewport |
| 5 | **Performance** | Nenhum `setState-in-effect` novo | Erros pré-existentes tolerados; novos bloqueiam |
| 6 | **Segurança** | RLS preservado, service role não exposto | Nenhuma nova exposição |
| 7 | **Permissões** | Validar isolamento SELF/SECTOR/GLOBAL | Funcionário não vê dados de outro; Líder vê só seu setor |
| 8 | **SLA** | Testar contagem após atribuição | Alerta dispara em 10 min sem resposta |
| 9 | **Dashboard** | Validar regra de atualização | Versão anterior preservada até nova ser validada |
| 10 | **Documentação** | PROJECT_STATE, ARCHITECTURE, CONTRACT, TODO_NEXT, ROADMAP | Versões, cargos, permissões e sprints atualizados |
| 11 | **Commit** | `git status` limpo (só arquivos intencionais) | Nenhum arquivo não relacionado no commit |
| 12 | **Pendências** | PENDENCIAS_EXECUCAO_AUTONOMA.md | Nenhuma pendência bloqueante ativa |
| 13 | **Infraestrutura** | `docker ps` e `docker compose ls` | Apenas projeto `infrastructure` rodando |
| 14 | **Caminhos** | `Select-String` por paths absolutos antigos | Nenhuma referência a `C:\Users\User\Downloads` |

## Último resultado — INFRA 3.3 (2026-07-23)

| Item | Status |
|---|---|
| Build | ✅ 29 páginas, 0 TypeScript errors |
| Lint | ⚠️ Erros pré-existentes tolerados |
| Secret scan | ✅ Nenhuma credencial |
| Responsividade | ✅ Touch targets 44px consistentes |
| Performance | ⚠️ `setState-in-effect` pré-existentes |
| Segurança | ✅ RLS preservado |
| Permissões | ✅ Modelo por cargo documentado (SELF/SECTOR/GLOBAL/TECHNICAL_GLOBAL) |
| Dashboard | ✅ Regra de atualização com validação documentada |
| Documentação | ✅ ARCHITECTURE, CONTRACT, QUALITY_GATE, PROJECT_STATE atualizados |
| Infraestrutura | ✅ Unificada em C:\KLAWS\infrastructure |
| Caminhos | ✅ Nenhuma ref `C:\Users\User\Downloads` |

## Decisão

**QUALITY GATE APROVADO** — INFRA 3.3 concluído. Aguardando INFRA 3.4 para liberação da Fase 4.
