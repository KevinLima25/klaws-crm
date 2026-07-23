# SPRINT UX 2.1 — TOUCH TARGETS E REFINAMENTOS MOBILE

Modelo: DeepSeek V4 Flash.

Dependência: UX 2.0 concluído, Quality Gate aprovado.

Objetivo: garantir área mínima de interação de 44x44px em todos os elementos clicáveis, corrigir espaçamentos e refinamentos mobile remanescentes.

## Escopo

### Obrigatório
1. **Touch targets mínimos:** todos os botões, links, inputs, selects, switches, checkboxes com `min-h-[44px]` e `min-w-[44px]` onde aplicável
2. **Padding/espacamento:** aumentar padding em cards, listas e containers no mobile para evitar toque acidental
3. **Formulários mobile:** inputs com padding vertical adequado para digitação confortável
4. **Tabelas responsivas:** corrigir cells com altura mínima para toque em linhas clicáveis
5. **Navegação:** estados `active`/`focus` visíveis em elementos de interação

### Não implementar
- Nova funcionalidade
- Refatoração de componentes existentes
- Alteração de API
- Alteração de banco
- Alteração de UX sprint anterior
- Dashboard, Timeline, Chat, Perfil

## Critérios de sucesso
- Todos os elementos clicáveis ≥ 44x44px no mobile
- Navegação por toque sem erros de target
- Build TypeScript 0 erros
- Quality Gate mantido
- Commit exclusivo, sem arquivos não relacionados
