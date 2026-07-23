# CHANGELOG — KLAWS CRM

## 2026-07-23 — Documentação de Arquitetura e Contrato

### Arquivos alterados

#### `.ai/ARCHITECTURE.md`
- Adicionado fluxo de comunicação: IA realiza exclusivamente triagem (CPF/Matrícula → Setor → Fila → Posição → Handoff)
- Adicionado WhatsApp Oficial: atendimento distribuído por fila, conversas encerradas retornam para fila
- Adicionado WhatsApp Individual: cada funcionário com número próprio, líder gerencia disponibilidade
- Adicionado SLA: contagem inicia após atribuição, alerta em 10 min sem resposta
- Adicionada regra de atualização do Dashboard: nunca apagar última versão, validar antes de substituir
- Adicionado Histórico: Supabase (mensagens/auditoria/metadados) + Google Drive (arquivos)
- Adicionado modelo de Permissões: exclusivamente por cargo, escopos SELF/SECTOR/GLOBAL/TECHNICAL_GLOBAL
- Adicionado mapeamento de Cargos x Escopos (8 cargos)
- Adicionado perfil SUPER ADMIN (técnico, não operacional)
- Adicionada regra de Timeline: somente Líder e superiores
- Adicionado Isolamento de Dados: funcionário nunca vê clientes de outro funcionário
- Adicionada Arquitetura Monocliente: Cartão de Todos Campinas Sul, sem multiempresa

#### `.ai/CONTRACT.md`
- Adicionada REGRA 24 — Fluxo de Atendimento (IA)
- Adicionada REGRA 25 — WhatsApp (Oficial + Individual)
- Adicionada REGRA 26 — SLA
- Adicionada REGRA 27 — Dashboard
- Adicionada REGRA 28 — Permissões e Cargos (escopos, mapeamento, SUPER ADMIN)
- Adicionada REGRA 29 — Timeline
- Adicionada REGRA 30 — Isolamento de Dados
- Adicionada REGRA 31 — Arquitetura Monocliente

#### `.ai/PROJECT_STATE.md`
- Versão atualizada para 3.2
- Infraestrutura marcada como migrada (INFRA 3.3 concluído)
- Status atualizado com documentação de arquitetura

#### `.ai/QUALITY_GATE.md`
- Adicionados critérios: Permissões, SLA, Dashboard, Infraestrutura
- Resultado atualizado para INFRA 3.3
- Removida referência a Review Gate UX 2.3

#### `.ai/ROADMAP_AUTONOMO.md`
- INFRA 3.3 marcado como concluído
- Adicionado escopo estimado da Fase 4

#### `.ai/sprints/ORDEM_DE_EXECUCAO.md`
- INFRA 3.3 marcado como concluído

#### `infrastructure/docker-compose.yml`
- Corrigido healthcheck do CRM ( `/api/health` → `/login` )
