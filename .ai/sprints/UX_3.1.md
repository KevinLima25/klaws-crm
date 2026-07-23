# SPRINT UX 3.1 — PERFIL OPERACIONAL DO CLIENTE

Modelo: DeepSeek V4 Flash.

Dependências:
- UX 3.0 concluído
- Quality Gate aprovado
- deploy validado

## Objetivo
Transformar a visualização do cliente em um perfil operacional completo, aproveitando Timeline e Central de Atendimento.

## Escopo obrigatório
- Cabeçalho com nome, matrícula, CPF mascarado, telefone, e-mail, status, unidade, responsável e alertas disponíveis.
- Resumo de pendências, comprovantes, conciliações, importações, agenda e eventos recentes.
- Timeline integrada com filtros e carregamento incremental quando necessário.
- Seções reais: Visão geral, Financeiro, Comprovantes, Conciliações, Agenda, Histórico e Pendências.
- Ações existentes: abrir pendência, comprovante, conciliação, agenda e retornar à Central.
- Respeitar permissões, mascaramento e isolamento de dados.
- Responsividade completa.

## Não implementar
Edição irrestrita, WhatsApp, chat, IA, observações livres sem modelo aprovado, baixa financeira, alteração contratual, novas regras, refatoração do motor ou mudanças na Agenda.

## Critérios de sucesso
Dados reais, timeline integrada, contexto claro, nenhum vínculo por nome, permissões, responsividade, TypeScript, lint, build, Quality Gate e commit exclusivo.

## Entrega final
Páginas, componentes, fontes, seções, ações, permissões, responsividade, testes, commit, limitações e pendências.

Não iniciar outro sprint automaticamente.
