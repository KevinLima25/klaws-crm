# SPRINT UX 3.2 — REVIEW GATE DA FASE 3

Modelo recomendado: DeepSeek V4 Pro.

Dependências:
- UX 3.0 concluído
- UX 3.1 concluído
- deploys validados
- Quality Gate aprovado

## Objetivo
Revisar integralmente a Fase UX 3.x antes de qualquer Fase UX 4.x, especialmente antes do WhatsApp.

## Revisar
Central de Atendimento, busca, contexto, navegação, Perfil do Cliente, Timeline, Pendências, Agenda, permissões, performance, segurança, responsividade, produção e documentação.

## Validações obrigatórias
- Fluxos: localizar cliente, abrir contexto, navegar entre Timeline, Pendências, Comprovantes, Conciliação e Agenda.
- Identificação segura por ID, matrícula e CPF; nome só como busca; tratar homônimos.
- Permissões por cargo e bloqueios visuais/API.
- Performance: chamadas, duplicações, payloads, cache, timeline >100, cursor pagination, índices e RPC.
- Segurança: RLS, APIs protegidas, isolamento, secret scan e ausência de service role no cliente.
- UX em 320, 375, 390, 768, 1024 e 1440px.
- Comparação localhost, GitHub e Vercel com smoke tests.

## Correções permitidas
Bugs, regressões, responsividade, consultas, permissões, estados, documentação, arquivos não versionados e build.

## Proibido sem aprovação
WhatsApp, WAHA, fila de mensagens, IA, RAG, nova arquitetura de agentes, mudanças na Agenda, migrations destrutivas ou regras de negócio.

## Prontidão para Fase 4
Central e Perfil estáveis, identificação segura, permissões validadas, performance aceitável, build/lint/TypeScript/deploy/smoke tests aprovados, nenhuma pendência crítica e rollback documentado.

## Entrega final
Resumo, fluxos aprovados, correções, pendências, performance, segurança, produção, commits, itens necessários antes do WhatsApp e decisão: FASE 4 LIBERADA ou BLOQUEADA.

Não criar nem iniciar qualquer UX 4.x automaticamente.
