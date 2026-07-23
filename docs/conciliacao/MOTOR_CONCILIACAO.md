# MOTOR DE CONCILIACAO BANCARIA
## KLAWS CRM — Sprint 2.3

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
| Comprovantes | — | `comprovantes` | Via OCR (integracao futura) |

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

### Ordem de prioridade

1. **Matricula** (exata, UPPERCASE)
2. **CPF** (11 digitos exatos)
3. **Documento** (exato, sem espacos)

### A. CONCILIADO_EXATO (REGRA_A)
- Matricula OU CPF exato
- Valor exato (diferenca = 0)
- Data exata (diferenca = 0 dias)
- Registro unico (nao ambiguo)
- **Confianca:** deterministica

### B. CONCILIADO_DOCUMENTO (REGRA_B)
- Documento exato
- Valor compativel (diferenca <= R$ 0,02)
- Registro ainda nao utilizado
- **Confianca:** deterministica

### C. PENDENTE_SEM_CORRESPONDENCIA (REGRA_C)
- Nenhum candidato encontrado em nenhuma origem
- OU candidatos existem mas nao atendem a nenhuma regra deterministica
- **Confianca:** deterministica

### D. DIVERGENCIA_VALOR (REGRA_D)
- Matricula/CPF/Documento correspondente
- Diferenca de valor > R$ 0,02
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
| Tolerancia monetaria (documento) | R$ 0,02 | ⚠️ Pendente aprovacao |
| Tolerancia data (compativel) | ± 1 dia | ⚠️ Pendente aprovacao |
| Timezone | America/Sao_Paulo (UTC-3) | ⚠️ Pendente aprovacao |
| Arredondamento | 2 casas decimais (half-up) | Padrao |
| Formato matricula | UPPERCASE, sem especiais | ✅ |
| Formato CPF | 11 digitos apenas | ✅ |
| Estornos | Nao tratado | ⚠️ Pendente |
| Taxas bancarias | Nao tratado | ⚠️ Pendente |
| Pagamentos agrupados/fracionados | PENDENTE_CONFERENCIA | ⚠️ Pendente |

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
| `conferido` | BOOLEAN | Marcado como conferido |
| `motivo` | TEXT | Justificativa do resultado |
| `created_at` | TIMESTAMPTZ | Data de criacao |

---

## 7. IDEMPOTENCIA

- Chave unica: `{MIN(id_a, id_b)}:{MAX(id_a, id_b)}:{STATUS}` para pares
- Chave unica: `{id}:{STATUS}` para registros isolados
- UPSERT com `ON CONFLICT (idempotencia_key) DO NOTHING`
- Segunda execucao nao gera duplicatas
- Registros ja conciliados sao ignorados na busca de candidatos

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
    "pendentes_sem_correspondencia": 20,
    "divergencia_valor": 8,
    "divergencia_data": 5,
    "divergencia_valor_data": 3,
    "ambiguos": 2,
    "duplicados": 3,
    "dados_insuficientes": 2,
    "erros": [],
    "executado_em": "2026-07-22T..."
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
| Sem cruzamento com comprovantes | Comprovantes OCR nao participam da conciliacao | Sprint futuro |
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

Para desfazer uma execucao:
```sql
DELETE FROM public.conciliacoes WHERE lote_execucao = '<uuid_do_lote>';
```

Os registros originais em `importacoes` nunca sao alterados pelo motor.

---

## 13. ARQUIVOS RELACIONADOS

| Arquivo | Descricao |
|---|---|
| `crm/src/lib/conciliacao.ts` | Motor deterministico |
| `crm/src/app/api/conciliacao/route.ts` | API REST |
| `crm/src/app/api/conciliacao/teste/route.ts` | Testes automatizados |
| `crm/src/app/admin/conciliacao/page.tsx` | Interface de execucao |
| `crm/supabase/migrations/00006_create_conciliacoes.sql` | Migration |
| `docs/conciliacao/MOTOR_CONCILIACAO.md` | Este documento |
