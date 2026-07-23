# SPRINT UX 2.1 — TOUCH TARGETS E REFINAMENTOS MOBILE

Modelo: DeepSeek V4 Flash.

Dependência:
- UX 2.0 concluído
- Quality Gate aprovado
- git status limpo

Objetivo:

Garantir uma área de interação confortável em dispositivos móveis,
corrigir espaçamentos remanescentes e melhorar estados de foco,
sem alterar funcionalidades ou arquitetura.

## Escopo obrigatório

### 1. Touch targets

Garantir área mínima aproximada de 44x44px nos elementos interativos
utilizados em telas mobile, quando tecnicamente aplicável:

- botões;
- botões somente com ícone;
- links de navegação;
- switches;
- checkboxes;
- radio buttons;
- ações em tabelas;
- controles de modais;
- botão de exibir/ocultar senha.

Não aplicar `min-w-[44px]` indiscriminadamente em inputs, selects
ou componentes que precisem ocupar a largura do container.

Quando o elemento visual precisar continuar pequeno,
aumentar a área clicável por padding ou wrapper acessível.

### 2. Espaçamento mobile

Revisar cards, listas, cabeçalhos e containers que apresentem:

- ações muito próximas;
- risco de toque acidental;
- conteúdo encostado;
- botões sobrepostos;
- baixa legibilidade.

Aplicar mudanças apenas nos breakpoints mobile.

Não alterar o espaçamento global do sistema sem necessidade.

### 3. Formulários mobile

Garantir:

- altura confortável dos campos;
- padding vertical adequado;
- labels legíveis;
- mensagens de validação sem sobreposição;
- botões principais acessíveis;
- botão de exibir senha com área de toque suficiente;
- foco visível.

### 4. Tabelas e listas

Nas linhas ou ações clicáveis:

- garantir altura mínima adequada;
- separar ações próximas;
- preservar scroll horizontal controlado;
- não esconder informações críticas;
- não transformar tabelas já aprovadas sem necessidade.

### 5. Navegação e acessibilidade

Garantir estados visíveis de:

- active;
- hover;
- focus-visible;
- disabled;
- pressed, quando aplicável.

Preservar navegação por teclado.

## Prioridade de revisão

Revisar obrigatoriamente:

1. `/admin/agentes`
2. modais de troca de senha
3. sidebar mobile
4. tabelas administrativas
5. formulários de login e administração
6. Timeline do cliente
7. Dashboard

## Não implementar

- nova funcionalidade;
- novas páginas;
- refatoração ampla;
- alteração de API;
- alteração de banco;
- migration;
- Dashboard novo;
- Timeline nova;
- Chat;
- Perfil;
- WhatsApp;
- IA;
- OCR;
- mudança de identidade visual.

## Proteção de escopo

Não alterar arquivos não relacionados.

Caso um componente compartilhado precise ser ajustado:

- verificar todas as páginas que o utilizam;
- preservar o comportamento desktop;
- validar que não houve regressão visual;
- registrar a alteração no relatório.

## Validação

Verificar nas larguras:

- 320px;
- 375px;
- 390px;
- 768px;
- 1024px;
- 1440px.

Confirmar:

- elementos interativos confortáveis no mobile;
- nenhum overflow horizontal novo;
- nenhum botão cortado;
- modais utilizáveis;
- foco visível;
- TypeScript com 0 erros;
- lint aprovado;
- build aprovado;
- secret scan aprovado;
- git status limpo após o commit.

## Commit

Criar commit exclusivo para este sprint.

Não incluir:

- arquivos de outros sprints;
- arquivos temporários;
- mudanças não relacionadas.

## Entrega final

Informar apenas:

1. páginas revisadas;
2. componentes alterados;
3. touch targets corrigidos;
4. ajustes mobile realizados;
5. eventuais componentes compartilhados alterados;
6. resultado do TypeScript;
7. resultado do lint;
8. resultado do build;
9. resultado do Quality Gate;
10. commit gerado;
11. pendências acumuladas.

Não criar ou iniciar outro sprint automaticamente.
Aguardar revisão do usuário.