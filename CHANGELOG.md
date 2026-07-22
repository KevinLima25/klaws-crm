# Changelog

## v0.1.0-alpha (2026-07-22)

Sprint 1.8 — OCR LOCAL (Tesseract via Microserviço HTTP)

### Adicionado

- **OCR Local com Tesseract**: microserviço HTTP independente (`ocr-service`) em Alpine com tesseract-ocr
- **EXECUTAR OCR**: Code node que lê binário do comprovante, envia para ocr-service e retorna resultado
- **SALVAR OCR .TXT**: Write Binary File que persiste resultado OCR em disco
- **ocr-service/**: Dockerfile, server.js (POST /ocr, GET /health), package.json
- **Set Metadados**: 9 campos de metadados (ocr_status, ocr_engine, ocr_texto, ocr_erro, etc.)
- **Graceful error handling**: OCR indisponível retorna `erro_conexao` sem quebrar o fluxo

### Modificado

- **docker-compose.yml**: adicionado serviço `ocr-service` (porta 3002) e variável `OCR_SPACE_API_KEY`
- **Agente_Comprovante (WFCRM001comp01)**: expandido de 6 para 10 nós com pipeline OCR
- **VALIDAR ARQUIVO**: corrigido uso de `$input.all()` → `items` (runner JS Task Runner não suporta `$input`)
- **EXECUTAR OCR**: corrigido acesso a `items` (runner declara `const items` internamente — evitar redeclaração)
- **.gitignore**: adicionado patterns para n8n data, database, storage
- **.env.example**: criado com todas as variáveis necessárias
- **README.md**: criado com documentação completa

### Removido

- **WFCRM001ocr01**: desativado (workflow antigo com `$env` que contaminava logs do runner)
- **~195 scripts debug temporários**: check_*.js/py, debug*.js, fix_*.js/py, test_*.js, dump_*.js, verify_*.js
- **Database backups**: database_backup.sqlite, database_clean.sqlite, database_corrupt.sqlite
- **Arquivos temporários**: restart_n8n.bat, update_workflow.csx, contrato.txt, cookies.txt

### Bugs Corrigidos

- `$input` em Code nodes causa SyntaxError no JS Task Runner (runner substitui `$input` incorretamente)
- `const items = items` causa Temporal Dead Zone (runner já declara `items`)
- WriteBinaryFile falha se diretório pai não existe (`fs.realpath`)
- WFCRM001ocr01 com `$env` contamina logs e interfere em todos os workflows

### Testes

6/6 cenários passando:
- PDF, JPG, PNG: HTTP 200 + graceful OCR error
- OCR indisponível: `erro_conexao` no response
- Arquivo corrompido: erro Tesseract propagado
- .txt files no disco: verificados

### Pendências

- [ ] Migration 003 não aplicada (tabelas comprovantes, agentes_config, message_buffer)
- [ ] Google Calendar OAuth redirect não registrado
- [ ] WAHA webhook não existe no n8n
- [ ] webhookId null (CRM Chat)
- [ ] Secrets hardcoded no docker-compose.yml (N8N_ENCRYPTION_KEY, WAHA_API_KEY)

### Segurança

- **Secrets removidos do histórico Git**: SUPABASE_SERVICE_ROLE_KEY, N8N_ENCRYPTION_KEY, WAHA_API_KEY, senhas WAHA, JWT de API n8n
- **Git filter-repo** utilizado para reescrever todo o histórico
- `.env.example` criado como template seguro (apenas placeholders)
- `n8n/data/database.sqlite` removido do histórico e gitignorado
- **Ação necessária**: Revogar SUPABASE_SERVICE_ROLE_KEY comprometida e gerar nova chave no Supabase Dashboard
