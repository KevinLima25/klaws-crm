# SPRINT UX 2.2 — CENTRAL DE PENDÊNCIAS

Modelo: DeepSeek V4 Flash.

Dependências:
- UX 2.1 concluído
- Quality Gate aprovado
- git status limpo
- deploy anterior validado

## Objetivo
Criar uma Central de Pendências operacional para concentrar todos os registros que exigem ação humana, sem alterar regras do motor de conciliação, OCR ou atendimento.

## Escopo obrigatório
- Exibir pendências reais de OCR, comprovantes, conciliações, dados insuficientes, aguardando documento, conferência e importações.
- Implementar filtros reais por tipo, status, período, origem, unidade e responsável quando houver fonte.
- Mostrar tipo, cliente/identificador, matrícula, data, origem, valor, motivo, status, prioridade e ação disponível.
- Criar detalhe em modal/drawer com origem, logs, lote, regra aplicada, histórico e links relacionados.
- Permitir apenas ações já existentes e seguras: abrir registro, marcar para revisão, visualizar comprovante/conciliação e abrir timeline.
- Implementar loading, vazio, erro, sem permissão, sem resultados e dados parciais.
- Preservar responsividade e RLS.

## Não implementar
WhatsApp, chat, IA, RAG, embeddings, nova estrutura OCR, novas automações, exclusão, baixa manual, alteração de regras ou refatoração ampla.

## Critérios de sucesso
Dados reais, filtros funcionais, nenhuma ação fictícia, responsividade, TypeScript 0 erros, lint, build, secret scan, Quality Gate e commit exclusivo.

## Entrega final
Fontes, categorias, filtros, ações, componentes, limitações, testes, Quality Gate, commit e pendências.

Não criar nem iniciar outro sprint automaticamente.
