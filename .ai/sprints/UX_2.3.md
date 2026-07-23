# SPRINT UX 2.3 — REVIEW GATE DA FASE 2

Modelo recomendado: DeepSeek V4 Pro.

Dependências:
- UX 2.2 concluído
- commits enviados
- deploy concluído
- produção acessível

## Objetivo
Revisar integralmente a Fase UX 2.x antes de autorizar a Fase UX 3.x.

## Revisar
- UX 2.0 Timeline
- UX 2.1 Touch Targets
- UX 2.2 Central de Pendências
- dashboard e navegação afetados
- componentes compartilhados
- permissões/RLS
- performance
- localhost × GitHub × Vercel
- documentação

## Validações
- Busca por matrícula e fallback por CPF; nunca vínculo automático por nome.
- Timeline, filtros, pendências, detalhes, links e estados.
- Fontes reais, associações seguras, duplicidades e dados parciais.
- Número de consultas, fallback RPC, timeline grande, necessidade de cursor pagination e índices.
- RLS, isolamento, dados mascarados, ausência de service role no cliente e secret scan.
- Responsividade em 320, 375, 390, 768, 1024 e 1440px.
- Smoke tests em produção.

## Correções permitidas
Bugs, regressões, responsividade, tipagem, consultas incorretas, estados ausentes, documentação e arquivos não commitados.

## Proibido sem aprovação
Alterar arquitetura, regras de negócio, motor de conciliação, OCR, permissões estratégicas, migrations destrutivas ou funcionalidades da Fase 3.

## Resultado
Classificar itens como APROVADO, CORRIGIDO, ACEITO COM BACKLOG ou BLOQUEADOR.

## Liberação da Fase 3
Somente sem bloqueadores, com build, TypeScript, lint, git limpo, deploy, smoke tests e documentação aprovados.

## Entrega final
Resumo, aprovados, correções, backlog, bloqueadores, performance, segurança, produção, commits e decisão: FASE 3 LIBERADA ou BLOQUEADA.

Não iniciar UX 3.0 sem confirmação do usuário.
