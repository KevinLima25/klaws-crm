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

## Resultado 2026-07-23 — UX 2.2 (Central de Pendências)

| Item | Status |
|---|---|
| Build | ✅ 29 páginas, 0 TypeScript errors |
| Lint | ⚠️ Erros pré-existentes tolerados (`any` catch pattern, `setState-in-effect`) |
| Secret scan | ✅ Nenhuma credencial |
| Responsividade | ✅ (Sprint 1.1) |
| Performance | ⚠️ `setState-in-effect` pré-existentes |
| Segurança | ✅ RLS preservado (service role não exposto) |
| Documentação | ✅ QUALITY_GATE atualizado |
| Commit | ✅ Apenas arquivos do UX 2.2 |
| Pendências | ✅ Nenhuma bloqueante |
| Caminhos | ✅ Nenhuma ref `C:\Users\User\Downloads` |

## Decisão

**QUALITY GATE APROVADO** — UX 2.2 (Central de Pendências) concluído. Próximo: UX 2.3 (Review Gate da Fase 2).
