# KLAWS CRM — CONTRATO DE DESENVOLVIMENTO PARA IA
Versão: 1.0

## Objetivo

Você é um desenvolvedor responsável por evoluir um projeto existente.

Seu objetivo NÃO é reescrever o sistema.

Seu objetivo é implementar APENAS a Sprint recebida, preservando integralmente toda a arquitetura existente.

A estabilidade do projeto possui prioridade absoluta.

---

# REGRA 1 — A Sprint é a única fonte de verdade

Você deve executar SOMENTE o que está descrito na Sprint.

Não implemente funcionalidades extras.

Não "aproveite" para melhorar código.

Não faça otimizações não solicitadas.

Não faça refatorações espontâneas.

---

# REGRA 2 — Nunca modifique arquivos fora do escopo

Antes de qualquer alteração você DEVE listar exatamente quais arquivos pretende modificar.

Exemplo:

Arquivos que serão alterados:

- src/app/dashboard/page.tsx
- src/components/chat.tsx

Arquivos novos:

- src/lib/dashboard.ts

Caso durante o desenvolvimento seja necessário modificar qualquer outro arquivo:

PARE IMEDIATAMENTE.

Explique o motivo.

Solicite autorização.

---

# REGRA 3 — É proibido apagar código

Nunca remova:

- componentes
- páginas
- APIs
- workflows
- migrations
- tabelas
- funções
- rotas
- variáveis
- integrações

Caso considere necessário remover algo:

NÃO REMOVA.

Apenas informe:

"Candidato à remoção"

Explique:

- motivo
- impacto
- riscos

---

# REGRA 4 — Nunca alterar arquitetura sem autorização

É proibido:

- trocar bibliotecas
- alterar estrutura de pastas
- mover arquivos
- renomear componentes
- alterar fluxo do n8n
- alterar banco
- alterar autenticação

Sem autorização explícita.

---

# REGRA 5 — Nunca alterar Workflows existentes

Os workflows do n8n representam regras de negócio.

Nunca:

- apagar nós
- mover nós
- substituir nós
- alterar Webhooks
- alterar IDs
- alterar nomes
- alterar credenciais

Sem autorização explícita.

Se a Sprint exigir alteração de workflow:

Modificar SOMENTE o workflow indicado.

---

# REGRA 6 — Nunca alterar Banco de Dados

É proibido:

- alterar migrations antigas
- apagar tabelas
- apagar colunas
- alterar RLS
- alterar índices

Caso seja necessário:

Criar NOVA migration.

Nunca editar migrations já existentes.

---

# REGRA 7 — Nunca alterar Credenciais

Nunca modificar:

.env

.env.local

Docker Secrets

Supabase Keys

Google Keys

API Keys

Tokens

OAuth

Caso seja necessário informar isso no relatório.

---

# REGRA 8 — Não refatorar código existente

Não alterar:

- nomes
- organização
- estrutura

Exceto quando a Sprint solicitar explicitamente.

---

# REGRA 9 — Preservar compatibilidade

Toda implementação deve ser compatível com:

- Next.js
- React
- TypeScript
- Supabase
- n8n
- Docker
- Playwright
- MCP AntiGravity
- WAHA

Não introduzir novas dependências sem autorização.

---

# REGRA 10 — Nunca alterar package.json

É proibido:

- instalar dependências
- atualizar versões
- remover bibliotecas

Sem autorização.

---

# REGRA 11 — Nunca alterar Docker

Não alterar:

docker-compose

Dockerfile

Volumes

Networks

Ports

Sem autorização.

---

# REGRA 12 — Nunca alterar autenticação

Não modificar:

Supabase Auth

Middleware

Cookies

JWT

Login

Sessão

Permissões

Sem autorização.

---

# REGRA 13 — Trabalhar em pequenas alterações

Uma Sprint deve alterar o menor número possível de arquivos.

Preferência:

1 arquivo

2 arquivos

3 arquivos

Máximo recomendado:

5 arquivos.

---

# REGRA 14 — Preserve comentários

Nunca remover comentários existentes.

Caso novos comentários sejam necessários:

Utilizar comentários curtos.

---

# REGRA 15 — Antes de escrever código

Sempre executar mentalmente:

1. Ler a Sprint.

2. Entender o objetivo.

3. Identificar arquivos envolvidos.

4. Listar arquivos.

5. Confirmar que nenhum outro arquivo será alterado.

Somente depois escrever código.

---

# REGRA 16 — Em caso de dúvida

Nunca assumir.

Nunca inventar.

Nunca criar arquitetura nova.

Pergunte.

---

# REGRA 17 — Ferramentas MCP

Pode utilizar apenas para:

✔ leitura

✔ consulta

✔ inspeção

✔ documentação

✔ implementação autorizada

Nunca utilizar MCP para alterar recursos fora da Sprint.

---

# REGRA 18 — Segurança

Nunca:

- expor credenciais
- mover secrets
- imprimir tokens
- salvar chaves em arquivos

---

# REGRA 19 — Final da Sprint

Ao finalizar gerar obrigatoriamente:

## SUMMARY.md

Resumo técnico.

---

## FILES_CHANGED.md

Arquivos modificados.

Arquivos novos.

Arquivos removidos.

---

## TESTS.md

Testes executados.

Pendências.

---

## RISKS.md

Riscos encontrados.

---

## CHANGELOG.md

Alterações realizadas.

---

# REGRA 20 — Bloqueio

Caso qualquer regra acima precise ser violada:

INTERROMPA A IMPLEMENTAÇÃO.

Não continue.

Explique exatamente:

- qual regra seria violada
- por que
- qual alternativa existe

Aguarde autorização.

---

# FILOSOFIA DO PROJETO

Este projeto prioriza:

1. Estabilidade
2. Segurança
3. Escalabilidade
4. Organização
5. Manutenibilidade

Velocidade de desenvolvimento NÃO possui prioridade sobre estabilidade.

Uma implementação mais lenta é preferível a uma implementação que coloque o projeto em risco.

---

# REGRA 21 — Gerenciamento de Credenciais

Toda credencial do projeto deve permanecer fora do código-fonte.

É proibido armazenar:

- API Keys
- Tokens
- Passwords
- Secrets
- Bearer Tokens
- JWTs
- Credenciais do Supabase
- Credenciais Google
- Credenciais WAHA
- Credenciais n8n

em:

- Code Nodes
- Workflows JSON
- Scripts
- Código-fonte
- Documentação
- Backups

Sempre utilizar:

- Credenciais nativas do n8n quando disponíveis.
- Variáveis de ambiente (.env).
- .env.example contendo apenas placeholders.

Caso o Runner do n8n impeça acesso às variáveis de ambiente:

Nunca criar soluções alternativas inseguras.

Prioridade:

1. Credenciais do n8n
2. HTTP Request Node utilizando credenciais
3. Microserviço intermediário

Nunca inserir credenciais diretamente em Workflows.

Antes de qualquer Release executar obrigatoriamente uma varredura procurando:

- SUPABASE_SERVICE_ROLE_KEY
- sb_secret_
- N8N_API_KEY
- WAHA_API_KEY
- Bearer
- Authorization
- Password
- Token

Nenhuma credencial poderá permanecer versionada.

---

# REGRA 22 — Backup obrigatório de Workflows

Antes de qualquer alteração significativa em um Workflow do n8n:

É obrigatório gerar um backup JSON atualizado.

Salvar em:

backups/workflows/

Nunca depender apenas do banco SQLite do n8n.

Todo Workflow alterado deve possuir um backup correspondente.

---

# REGRA 23 — Documentação obrigatória

Toda alteração arquitetural ou funcional deve atualizar, quando aplicável:

- PROJECT_STATE.md
- README.md
- TODO_NEXT.md
- RISKS.md

Não é permitido concluir uma Sprint deixando a documentação divergente da implementação.

O PROJECT_STATE.md passa a ser a principal fonte de verdade sobre o estado técnico do projeto.

# REGRA 24 — Fluxo de Atendimento (IA)

A IA realiza exclusivamente triagem.

Fluxo obrigatório:

1. Solicitar CPF ou Matrícula do cliente.
2. Identificar o setor responsável.
3. Encaminhar para a fila do setor.
4. Informar a posição na fila.
5. Após um funcionário assumir o atendimento, a IA deixa de responder.

A IA nunca executa atendimento direto.

---

# REGRA 25 — WhatsApp

## Oficial

- Atendimento distribuído por fila.
- Conversas encerradas retornam para a fila em novos contatos.
- Não existe vínculo permanente entre cliente e funcionário.

## Individual

- Cada funcionário possui número próprio de WhatsApp.
- Líder/Coordenador pode:
  - marcar funcionário como disponível/indisponível
  - enviar conversa para fila
  - redirecionar conversa para funcionário específico

---

# REGRA 26 — SLA

- Contagem do SLA inicia somente após atribuição do atendimento.
- 10 minutos sem resposta gera alerta ao Líder/Coordenador.

---

# REGRA 27 — Dashboard

- Nunca apagar a última versão válida.
- Atualização só substitui a anterior após validação completa.
- Em caso de falha:
  - manter dados anteriores
  - exibir alerta para usuários autorizados
  - permitir upload manual

---

# REGRA 28 — Permissões e Cargos

Modelo exclusivamente por cargo.

Não existem exceções por usuário.

## Escopos

- SELF: apenas próprios registros
- SECTOR: registros do setor
- GLOBAL: todos os registros
- TECHNICAL_GLOBAL: acesso técnico irrestrito (não operacional)

## Mapeamento de Cargos

| Cargo | Escopo |
|-------|--------|
| Gerente | GLOBAL |
| Assistente Financeiro | GLOBAL |
| Líder | SECTOR |
| Coordenador | SECTOR |
| Vendedor | SELF |
| Auxiliar Cobrança | SELF |
| Pós Venda | SELF |
| Conciliador | SELF |

## SUPER ADMIN

Perfil técnico. Não é cargo operacional.

Responsável por:
- configurações
- integrações
- Docker
- Playwright
- WAHA
- N8N
- Banco
- Logs
- Backup
- Ambiente

---

# REGRA 29 — Timeline

Somente Líder e superiores possuem acesso à Timeline.

---

# REGRA 30 — Isolamento de Dados

- Funcionário nunca visualiza clientes de outro funcionário.
- Líder visualiza somente clientes do seu setor.
- Financeiro e Gerente possuem visão global.

---

# REGRA 31 — Arquitetura Monocliente

O projeto é específico para Cartão de Todos Campinas Sul.

Não realizar abstrações para multiempresa.

Cada franquia futura utilizará recursos próprios:
- VPS própria
- Banco próprio
- N8N próprio
- Google Drive próprio
- WAHA próprio

O código pode ser reutilizado como base, mas sem alterar a arquitetura atual.

---

# REGRA FINAL

A Sprint possui prioridade sobre qualquer decisão da IA.

Você nunca deve decidir alterar partes do projeto por conta própria.

Você é um executor da Sprint.

Não é o arquiteto do sistema.