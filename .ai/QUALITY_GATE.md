# QUALITY GATE — KLAWS CRM

## Checklist obrigatório entre Sprints

| # | Item | Como verificar | Critério |
|---|---|---|---|
| 1 | **Build** | `npm run build` | 0 TypeScript errors, todas as páginas compilam |
| 2 | **Lint** | `npm run lint` | Erros pré-existentes tolerados; novos erros bloqueiam |
| 3 | **Secret scan** | `git diff --cached` ou `Select-String` por credenciais | Nenhuma chave/secret/token versionado |
| 4 | **Responsividade** | Testar sidebar, overflow, touch targets | Navegação funcional em mobile viewport |
| 5 | **Performance** | Nenhum `setState-in-effect` novo | Erros pré-existentes tolerados; novos bloqueiam |
| 6 | **Segurança** | RLS preservado, service role não exposto | Nenhuma nova exposição |
| 7 | **Documentação** | PROJECT_STATE, STATUS, TODO_NEXT, ROADMAP | Versões e sprints atualizados |
| 8 | **Commit** | `git status` limpo (só arquivos intencionais) | Nenhum arquivo não relacionado no commit |
| 9 | **Pendências** | PENDENCIAS_EXECUCAO_AUTONOMA.md | Nenhuma pendência bloqueante ativa |
| 10 | **Caminhos** | `Select-String` por paths absolutos antigos | Nenhuma referência a `C:\Users\User\Downloads` |

## Resultado 2026-07-23

| Item | Status |
|---|---|
| Build | ✅ 27 páginas, 0 TypeScript errors |
| Lint | ⚠️ 91 erros pré-existentes tolerados |
| Secret scan | ✅ Nenhuma credencial |
| Responsividade | ✅ (Sprint 1.1) |
| Performance | ⚠️ 5 `setState-in-effect` pré-existentes |
| Segurança | ✅ RLS preservado |
| Documentação | ✅ PROJECT_STATE, STATUS, TODO_NEXT, ROADMAP atualizados |
| Commit | ✅ Apenas arquivos intencionais |
| Pendências | ✅ Nenhuma bloqueante |
| Caminhos | ✅ Nenhuma ref `C:\Users\User\Downloads` |

## Decisão

**QUALITY GATE APROVADO** — Próximo Sprint autorizado: UX 2.1 (Touch Targets e Refinamentos Mobile)
