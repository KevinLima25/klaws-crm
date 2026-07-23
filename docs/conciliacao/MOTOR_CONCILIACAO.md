# MOTOR DE CONCILIACAO BANCARIA
## KLAWS CRM — Sprint 2.3 / 2.3A
### Motor Version: 2.3.0

---

## 1. VISÃO GERAL

Motor deterministico de conciliacao bancaria que compara registros normalizados de diferentes origens (extrato, CTN, planilhas) e classifica cada par conforme regras pre-definidas.

**Principio fundamental:** O mesmo conjunto de dados produz sempre o mesmo resultado.

---

## 2. FONTES DE DADOS

| Fonte | Origem | Tabela | Descricao |
|---|---|---|---|
| Extrato bancario | `csv` ou `planilha` | `importacoes` | Arquivos CSV/XLSX de extrato |
| Planilha CTN | `ctn` | `importacoes` | Arquivo posicional CTN (tipo 1) |
| Planilhas gerais | `planilha` | `importacoes` | XLS/XLSX com dados financeiros |
| Comprovantes OCR | — | `comprovantes` | Via Agente Comprovante (OCR Tesseract) |

---

## 3. CAMPOS NORMALIZADOS

| Campo | Normalizacao | Exemplo |
|---|---|---|
| `matricula` | UPPERCASE, trim, sem caracteres especiais | `ABC123` |
| `cpf` | 11 digitos numericos | `12345678901` |
| `valor` | Decimal com 2 casas (R$ removido) | `150.00` |
| `data_pagamento` | ISO YYYY-MM-DD | `2026-06-15` |
| `documento` | Trim, sem espacos extras | `DOC-001` |
| `banco` / `agencia` / `conta` | Trim | `001` |

---

## 4. REGRAS DE CONCILIACAO

### Ordem de prioridade de identificadores

1. **Documento** (identificador bancario / numero transacao)
2. **Hash do comprovante** (`arquivo_drive_id` × `documento`)
3. **Matricula** (exata, UPPERCASE)
4. **CPF** (11 digitos exatos)
5. **Valor + Data** (combinacao exata)
6. **Nome** (sugestao apenas → PENDENTE_CONFERENCIA)

### A. CONCILIADO_EXATO (REGRA_A)
- Matricula OU CPF exato
- Valor exato (diferenca = 0)
- Data exata (diferenca = 0 dias)
- Registro unico (nao ambiguo)
- **Confianca:** deterministica

### B. CONCILIADO_DOCUMENTO (REGRA_B)
- Documento exato (import import) OU hash do comprovante exato (import comprovante)
- Valor exato (diferenca = R$ 0,00)
- Registro ainda nao utilizado
- **Confianca:** deterministica

### AGUARDANDO_DOCUMENTO
- Indicação de pagamento existe (importação com valor)
- Nenhum comprovante OCR recebido ainda para executar a conciliação
- **Confianca:** deterministica
- **Nota:** Status preparado para integração futura; atualmente não gerado pelo motor

### C. PENDENTE_SEM_CORRESPONDENCIA (REGRA_C)
- Nenhum candidato encontrado em nenhuma origem
- OU candidatos existem mas nao atendem a nenhuma regra deterministica
- **Confianca:** deterministica

### D. DIVERGENCIA_VALOR (REGRA_D)
- Matricula/CPF/Documento/Hash correspondente
- Diferenca de valor > R$ 0,00
- **Confianca:** deterministica

### E. DIVERGENCIA_DATA (REGRA_E)
- Matricula/CPF correspondente
- Valor compativel
- Diferenca de data > 1 dia
- **Confianca:** deterministica
- **Nota:** Se houver divergencia de valor E data simultaneamente, classifica como DIVERGENCIA_VALOR_DATA

### F. AMBIGUO_MULTIPLOS_CANDIDATOS (REGRA_F)
- Mais de um candidato atende aos criterios da mesma regra
- Registro marcado para conferencia humana
- **Confianca:** indeterminada (requer intervencao)

### G. DUPLICADO (REGRA_G)
- Mesmo documento ja utilizado em outra conciliacao
- OU tentativa de reuso de registro ja conciliado
- **Confianca:** deterministica

### H. DADOS_INSUFICIENTES (REGRA_H)
- Registro sem matricula, CPF ou documento
- Sem campos minimos para identificacao
- **Confianca:** deterministica

---

## 5. TOLERANCIAS

| Parametro | Valor | Status |
|---|---|---|
| Tolerancia monetaria | R$ 0,00 (exato obrigatorio) | ✅ Aprovado |
| Tolerancia data (compativel) | ± 1 dia | ✅ Aprovado |
| Timezone | America/Sao_Paulo (UTC-3) | ✅ Aprovado |
| Arredondamento | 2 casas decimais (half-up) | Padrao |
| Formato matricula | UPPERCASE, sem especiais | ✅ |
| Formato CPF | 11 digitos apenas | ✅ |
| Estornos | Nao tratado (preparado para futuro) | Sprint futuro |
| Taxas bancarias | Nao tratado (preparado para futuro) | Sprint futuro |
| Pagamentos agrupados/fracionados | PENDENTE_CONFERENCIA | Sprint futuro |

---

## 6. MODELO DE DADOS

### Tabela: `conciliacoes`

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | UUID PK | Identificador unico |
| `id_importacao_a` | FK importacoes | Registro origem A |
| `id_importacao_b` | FK importacoes | Registro origem B |
| `id_comprovante` | FK comprovantes | Comprovante associado |
| `status` | TEXT | Status da conciliacao |
| `regra_aplicada` | TEXT | Regra que gerou o resultado |
| `campos_comparados` | JSONB | Campos utilizados na comparacao |
| `divergencias` | JSONB | Detalhes das divergencias |
| `valor_origem` | NUMERIC(14,2) | Valor do registro A |
| `valor_destino` | NUMERIC(14,2) | Valor do registro B |
| `diferenca_valor` | NUMERIC(14,2) | Diferenca entre valores |
| `data_origem` | DATE | Data do registro A |
| `data_destino` | DATE | Data do registro B |
| `idempotencia_key` | TEXT UNIQUE | Chave de idempotencia |
| `lote_execucao` | UUID | Identificador do lote |
| `motor_version` | TEXT | Versão do motor (2.3.0) |
| `lote_importacao` | UUID | Lote de importação (futuro) |
| `lote_conciliacao` | UUID | Lote de conciliação (= lote_execucao) |
| `lote_ocr` | UUID | Lote OCR (futuro) |
| `lote_whatsapp` | UUID | Lote WhatsApp (futuro) |
| `conferido` | BOOLEAN | Marcado como conferido |
| `motivo` | TEXT | Justificativa do resultado |
| `created_at` | TIMESTAMPTZ | Data de criacao |

---

## 7. IDEMPOTENCIA

- Chave unica: hash SHA256 deterministico de `{id_a}|{id_b}|{id_comprovante}|{status}`
- UPSERT com `ON CONFLICT (idempotencia_key) DO NOTHING` (indice UNIQUE)
- Segunda execucao nao gera duplicatas
- Registros ja conciliados sao ignorados na busca de candidatos

## 7.1. AUDITORIA (conciliacao_logs)

Toda decisao do motor e registrada na tabela `conciliacao_logs`:

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | UUID PK | Identificador unico |
| `lote_execucao` | UUID | Vinculo com o lote |
| `conciliacao_id` | FK conciliacoes | Vinculo com o resultado |
| `acao` | TEXT | Tipo de acao (INICIO_EXECUCAO, MATCH_DOCUMENTO, etc.) |
| `detalhes` | JSONB | Detalhes da decisao |
| `motor_version` | TEXT | Versão do motor (2.3.0) |
| `created_at` | TIMESTAMPTZ | Timestamp |

Acoes registradas: INICIO_EXECUCAO, DADOS_CARREGADOS, MATCH_DOCUMENTO, MATCH_COMPROVANTE_HASH, MATCH_MATRICULA, MATCH_CPF, MATCH_VALORDATA, SUGESTAO_NOME, AMBIGUO_*, CLASSIFICADO_SEM_PAR, COMPROVANTE_SEM_PAR, RESULTADOS_SALVOS, ERRO_SALVAR, ERRO_INESPERADO, FIM_EXECUCAO

---

## 8. PROCESSAMENTO

1. Carrega registros nao processados de `importacoes`
2. Filtra registros ja presentes em `conciliacoes` (status matched/divergent)
3. Agrupa por `origem` para comparacao entre origens diferentes
4. Constroi indices por matricula, CPF, documento para O(1) lookup
5. Para cada registro, busca candidatos em outras origens
6. Aplica regras em ordem de prioridade (A → B → D → E)
7. Registra resultado via UPSERT com chave de idempotencia
8. Casos ambiguos (F) sao marcados para conferencia
9. Registros sem candidatos (C) ou sem dados (H) sao registrados como pendentes

**Complexidade:** O(n) por par de origens (indexado, nao O(n²))

---

## 9. API

### POST /api/conciliacao
Executa o motor de conciliacao.

**Body (opcional):**
```json
{
  "origens": ["ctn", "planilha"],
  "data_inicio": "2026-01-01",
  "data_fim": "2026-12-31"
}
```

**Resposta:**
```json
{
  "status": "ok",
  "sumario": {
    "lote_execucao": "uuid",
    "total_processados": 100,
    "conciliados_exatos": 45,
    "conciliados_documento": 12,
    "aguardando_documento": 0,
    "pendentes_sem_correspondencia": 20,
    "divergencia_valor": 8,
    "divergencia_data": 5,
    "divergencia_valor_data": 3,
    "ambiguos": 2,
    "duplicados": 3,
    "dados_insuficientes": 2,
    "pendentes_conferencia": 0,
    "erros": [],
    "executado_em": "2026-07-22T...",
    "motor_version": "2.3.0"
  }
}
```

### GET /api/conciliacao
Consulta resultados com paginacao e filtro por status.

### POST /api/conciliacao/teste
Executa 14 cenarios de teste com dados controlados e retorna resultados.

---

## 10. LIMITACOES CONHECIDAS

| Limitacao | Impacto | Solucao futura |
|---|---|---|
| Sem tratamento de estornos | Valores negativos sao tratados como normais | Regras adicionais |
| Sem pagamentos fracionados | 1:1 apenas, nao 1:N ou N:M | Regra de rateio |
| Sem taxas bancarias | Tarifas nao sao identificadas | Campo "tipo" na importacao |
| Timezone fixo (UTC-3) | Datas em outros fusos podem divergir | Configuravel |
| Sem interface de conferencia | Ambiguos requerem UPDATE manual no banco | Tela de conferencia |

---

## 11. EXEMPLOS

### Exemplo 1: CONCILIADO_EXATO
```
Extrato: matricula=ABC123, valor=150.00, data=2026-06-15
CTN:     matricula=ABC123, valor=150.00, data=2026-06-15
Resultado: CONCILIADO_EXATO (REGRA_A)
```

### Exemplo 2: DIVERGENCIA_VALOR
```
Extrato: matricula=DEF456, valor=200.00
CTN:     matricula=DEF456, valor=250.00
Resultado: DIVERGENCIA_VALOR (REGRA_D), diferenca=R$ 50.00
```

### Exemplo 3: AMBIGUO
```
Extrato: matricula=GHI789, valor=150.00
CTN:     matricula=GHI789, valor=150.00 (registro 1)
CTN:     matricula=GHI789, valor=150.00 (registro 2)
Resultado: AMBIGUO_MULTIPLOS_CANDIDATOS (REGRA_F)
```

---

## 12. ROLLBACK

Para desfazer alteracoes do hotfix 2.3A (reverter migration 00008):
```sql
ALTER TABLE public.conciliacao_logs DROP COLUMN IF EXISTS motor_version;
ALTER TABLE public.conciliacoes DROP COLUMN IF EXISTS motor_version;
ALTER TABLE public.conciliacoes DROP COLUMN IF EXISTS lote_importacao;
ALTER TABLE public.conciliacoes DROP COLUMN IF EXISTS lote_conciliacao;
ALTER TABLE public.conciliacoes DROP COLUMN IF EXISTS lote_ocr;
ALTER TABLE public.conciliacoes DROP COLUMN IF EXISTS lote_whatsapp;

-- Restaurar CHECK constraint original (sem AGUARDANDO_DOCUMENTO)
ALTER TABLE public.conciliacoes DROP CONSTRAINT IF EXISTS conciliacoes_status_check;
ALTER TABLE public.conciliacoes ADD CONSTRAINT conciliacoes_status_check
  CHECK (status IN ('CONCILIADO_EXATO','CONCILIADO_DOCUMENTO','PENDENTE_SEM_CORRESPONDENCIA',
    'DIVERGENCIA_VALOR','DIVERGENCIA_DATA','DIVERGENCIA_VALOR_DATA','AMBIGUO_MULTIPLOS_CANDIDATOS',
    'DUPLICADO','DADOS_INSUFICIENTES','PENDENTE_CONFERENCIA'));
```

---

## 13. ARQUIVOS RELACIONADOS

| Arquivo | Descricao |
|---|---|
| `crm/src/lib/conciliacao.ts` | Motor deterministico |
| `crm/src/app/api/conciliacao/route.ts` | API REST |
| `crm/src/app/api/conciliacao/teste/route.ts` | Testes automatizados |
| `crm/src/app/admin/conciliacao/page.tsx` | Interface de execucao |
| `crm/supabase/migrations/00006_create_conciliacoes.sql` | Migration tabela principal |
| `crm/supabase/migrations/00007_create_conciliacao_logs.sql` | Migration tabela de auditoria |
| `crm/supabase/migrations/00008_conciliacao_archecture_refactor.sql` | Migration hotfix arquitetural (motor_version, lotes, AGUARDANDO_DOCUMENTO) |
| `docs/conciliacao/MOTOR_CONCILIACAO.md` | Este documento |
