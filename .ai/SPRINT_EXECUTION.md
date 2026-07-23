# CHECKLIST PADRÃO

## Preparação
- Verificar diretório atual (`C:\KLAWS`) e raiz Git (`C:\KLAWS`).
- Verificar remoto (`KevinLima25/klaws-crm.git`) e branch (`master`).
- Validar existência dos documentos obrigatórios:
  - `.ai/PROJECT_STATE.md`
  - `.ai/CONTRACT.md`
  - `.ai/ARCHITECTURE.md`
  - `.ai/ROADMAP_AUTONOMO.md`
  - `.ai/QUALITY_GATE.md`
  - `.ai/SPRINT_EXECUTION.md`
  - `.ai/PENDENCIAS_EXECUCAO_AUTONOMA.md`
  - `.ai/sprints/UX_3.1.md`
  - `.ai/sprints/UX_3.2.md`
  - `.ai/sprints/ORDEM_DE_EXECUCAO.md`
- Identificar páginas e componentes afetados.
- Confirmar compatibilidade com CONTRACT e ARCHITECTURE.

## Implementação
- Alterações pequenas e incrementais.
- Reutilizar componentes.
- Evitar dependências novas.
- Não alterar regras de negócio.

## Validação
Executar, quando disponíveis:
- TypeScript;
- lint;
- testes;
- build;
- inspeção de responsividade;
- verificação de overflow;
- rotas principais.

Não declarar build aprovado se não foi executado.

## Documentação
Atualizar, conforme aplicável:
- PROJECT_STATE;
- TODO_NEXT;
- RISKS;
- README.

## Commit
- Revisar diff.
- Fazer secret scan.
- Criar commit exclusivo.
- Registrar hash e mensagem.

## Progressão
- Problema não crítico: registrar e continuar.
- Bloqueio crítico: parar e consolidar pendências.
