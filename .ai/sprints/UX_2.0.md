# SPRINT UX 2.0 — TIMELINE DO CLIENTE

Modelo: DeepSeek V4 Flash.

Dependência: UX 1.2 concluído.

Objetivo: criar visão cronológica unificada do cliente usando dados existentes, sem inventar relacionamentos.

Antes de implementar:
1. mapear tabelas, APIs e relações;
2. identificar chaves seguras;
3. documentar fontes;
4. nunca usar nome como vínculo automático.

Ordem preferencial:
1. ID interno;
2. matrícula;
3. CPF;
4. relacionamento explícito.

Interface:
- cabeçalho com identificação, matrícula, CPF mascarado, contato e status;
- timeline com data/hora, tipo, origem, resumo, status e link;
- filtros por tipo, período e status;
- loading, vazio, erro, sem permissão e dados parciais.

Tipos apenas quando suportados:
- cadastro;
- importação;
- comprovante;
- OCR;
- conciliação;
- agendamento;
- alteração administrativa.

Segurança:
- respeitar RLS e permissões;
- não expor service role;
- não retornar dados de outro cliente;
- mascarar dados sensíveis.

Preferir estruturas existentes. Migration ou API só se estritamente necessária, segura e não destrutiva.

Não implementar:
- edição ampla;
- WhatsApp;
- chat;
- IA/RAG/embeddings;
- fila;
- Central de Pendências;
- alterações no motor;
- alterações no agente de Agenda.

Concluir com:
- timeline baseada em fontes reais;
- nenhum vínculo por nome;
- permissões preservadas;
- responsividade;
- TypeScript/build;
- documentação;
- commit exclusivo.
