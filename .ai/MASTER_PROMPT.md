# PROMPT MESTRE — EXECUÇÃO AUTÔNOMA DO ROADMAP UX

Leia, nesta ordem:

1. `.ai/CONTRACT.md`
2. `.ai/ARCHITECTURE.md`
3. `.ai/PROJECT_STATE.md`
4. `.ai/STATUS.md`
5. `.ai/RISKS.md`
6. `.ai/ROADMAP_AUTONOMO.md`
7. `.ai/AUTONOMOUS_MODE.md`
8. `.ai/SPRINT_EXECUTION.md`

Execute, em ordem obrigatória:

1. `.ai/sprints/UX_1.1.md`
2. `.ai/sprints/UX_1.2.md`
3. `.ai/sprints/UX_2.0.md`

Não pedir aprovação entre os sprints.

Ao concluir cada sprint:
- validar;
- corrigir falhas dentro do escopo;
- atualizar documentação;
- gerar commit exclusivo;
- registrar resumo;
- iniciar o próximo.

Todas as dúvidas, decisões, SQL manual, configurações externas, credenciais ausentes e ações de produção devem ser acumuladas em:

`.ai/PENDENCIAS_EXECUCAO_AUTONOMA.md`

Somente após concluir todos os sprints possíveis, apresentar um único bloco:

`PENDÊNCIAS PARA DECISÃO DO USUÁRIO`

Interromper apenas em caso de:
- risco de perda de dados;
- segredo exposto;
- necessidade de alterar CONTRACT;
- alteração irreversível em produção;
- migration destrutiva;
- bloqueio técnico essencial;
- testes críticos sem correção segura.

Restrições:
- não alterar regras de negócio;
- não alterar arquitetura central;
- não aplicar SQL em produção;
- não expor credenciais;
- não pular sprint;
- não misturar sprints no mesmo commit;
- preservar o agente de Agenda;
- fazer backup de workflows n8n antes de alterações;
- atualizar PROJECT_STATE, STATUS, TODO_NEXT e RISKS quando aplicável.

Entrega final:
1. sprints concluídos;
2. commits;
3. arquivos principais;
4. testes/builds;
5. pendências consolidadas;
6. SQL ou ações manuais;
7. itens para revisão arquitetural;
8. ponto exato onde o roadmap parou.

Comece por `.ai/sprints/UX_1.1.md`.
