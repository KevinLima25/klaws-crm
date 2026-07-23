# CHECKLIST PADRÃO

## Preparação
- Ler documentos obrigatórios.
- Verificar branch e working tree.
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
- STATUS;
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
