# SPRINT UX 3.0 — CENTRAL DE ATENDIMENTO

Modelo recomendado: DeepSeek V4 Pro para arquitetura inicial e V4 Flash para implementação.

Dependências:
- UX 2.3 aprovado
- Fase 3 liberada pelo usuário
- Quality Gate aprovado
- git status limpo

## Objetivo
Criar a Central de Atendimento como hub operacional do CRM, sem WhatsApp.

## Escopo obrigatório
- Página com busca rápida, clientes/atendimentos recentes quando houver fonte, painel de contexto, atalhos e ações rápidas.
- Busca por matrícula, CPF, telefone, ID interno e nome apenas como busca textual.
- Contexto com identificação, matrícula, CPF mascarado, contatos, situação, resumo financeiro disponível, pendências, comprovantes, conciliações, timeline e agenda existente.
- Navegação para Timeline, Pendências, Conciliação, Comprovantes, Agenda e cadastro existente.
- Apenas ações já existentes e autorizadas.
- Estados de loading, vazio, erro, sem permissão, não encontrado e dados parciais.
- Responsividade desktop, tablet e mobile.

## Arquitetura
Reutilizar APIs existentes, evitar duplicações, preservar RLS e não expor service role.

## Não implementar
WhatsApp, fila real, chatbot, IA, resposta automática, distribuição, SLA, notificações externas, mudanças na Agenda ou no motor de conciliação.

## Critérios de sucesso
Busca funcional, contexto correto, links válidos, nenhuma associação por nome, permissões, responsividade, TypeScript, lint, build, secret scan, Quality Gate e commit exclusivo.

## Entrega final
Arquitetura, fontes, busca, contexto, ações, APIs, limitações, testes, commit e pendências.

Não iniciar outro sprint automaticamente.
