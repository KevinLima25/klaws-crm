# KLAWS CRM — DATABASE INVENTORY (Supabase)

**Data da Auditoria:** 2026-07-21
**Fonte:** Migrations em `crm/supabase/migrations/`
**Status:** Migration 003 **NÃO APLICADA** no Supabase (conforme TODO_NEXT.md #1)

---

## TABELAS EXISTENTES (Migrations 001 + 002 aplicadas)

| Tabela | Schema | Descrição | RLS | Índices/Keys |
|--------|--------|-----------|-----|--------------|
| `profiles` | public | Perfil do usuário (estende auth.users) | ✅ | PK: id (FK auth.users), email, full_name, avatar_url, cargo (mig 002), created_at, updated_at |
| `chat_messages` | public | Histórico de mensagens do chat web | ✅ | PK: id (uuid), FK: user_id → auth.users, sender (check: user/bot), message, source, created_at |
| `funcionarios` | public | Base de funcionários (importada via CSV/admin) | ❓ | PK: id, nome, e-mail, cargo, email (mig 002), cargo (mig 002) |
| `vendas` | public | Dados de vendas para dashboard | ❓ | promotor_vendas, vendas, prospeccoes, refiliacoes, homologados_totais |
| `adimplencia` | public | Dados de adimplência para dashboard | ❓ | usuario_baixa, homologado (SIM/NÃO), valor_gerado |

---

## TABELAS DA MIGRATION 003 (PENDENTE)

| Tabela | Schema | Descrição | RLS | Políticas |
|--------|--------|-----------|-----|-----------|
| `comprovantes` | public | Comprovantes de pagamento (OCR/Conciliação) | ✅ | 1. Users view own (user_id = auth.uid())<br>2. Assistente Financeiro/Gerente view all<br>3. Assistente Financeiro/Gerente update |
| `agentes_config` | public | Configuração de quais cargos acessam quais agentes | ✅ | 1. Authenticated view all<br>2. Admin (Assistente Financeiro/Gerente) manage all |
| `message_buffer` | public | Buffer de mensagens recebidas antes do router (n8n Code node salva aqui) | ✅ | 1. Users insert own (user_id = auth.uid()) |

---

## FUNÇÕES E TRIGGERS

| Nome | Tipo | Descrição |
|------|------|-----------|
| `handle_new_user()` | Function (plpgsql) | Trigger AFTER INSERT on auth.users → cria row em profiles |
| `on_auth_user_created` | Trigger | Dispara handle_new_user() |

---

## POLÍTICAS RLS (Row Level Security)

### profiles
- `Users can view own profile` — SELECT WHERE auth.uid() = id
- `Users can update own profile` — UPDATE WHERE auth.uid() = id
- `Users can insert own profile` — INSERT WITH CHECK auth.uid() = id

### chat_messages
- `Users can view own messages` — SELECT WHERE auth.uid() = user_id
- `Users can insert own messages` — INSERT WITH CHECK auth.uid() = user_id

### comprovantes (mig 003)
- `Users can view own comprovantes` — SELECT WHERE auth.uid() = user_id
- `Assistente financeiro can view all` — SELECT WHERE EXISTS funcionarios(cargo IN ('ASSISTENTE FINANCEIRO','GERENTE') AND email = auth.email())
- `Assistente financeiro can update` — UPDATE mesma condição

### agentes_config (mig 003)
- `All authenticated can view agentes_config` — SELECT WHERE auth.role() = 'authenticated'
- `Admin can manage agentes_config` — ALL WHERE EXISTS funcionarios(cargo IN ('ASSISTENTE FINANCEIRO','GERENTE') AND email = auth.email())

### message_buffer (mig 003)
- `Users can insert own messages` — INSERT WITH CHECK auth.uid() = user_id

---

## SEED DATA (Mig 003)

### agentes_config — 11 cargos × 3 agentes = 33 rows (ON CONFLICT DO NOTHING)
| Cargo | Agente | Enabled |
|-------|--------|---------|
| VENDEDOR | atendimento | true |
| VENDEDOR | comprovante | false |
| VENDEDOR | conciliacao | false |
| COORDENADOR | atendimento | true |
| COORDENADOR | comprovante | false |
| COORDENADOR | conciliacao | false |
| LIDER DE VENDAS | atendimento | true |
| LIDER DE VENDAS | comprovante | false |
| LIDER DE VENDAS | conciliacao | false |
| AUXILIAR DE COBRANCA | atendimento | true |
| AUXILIAR DE COBRANCA | comprovante | true |
| AUXILIAR DE COBRANCA | conciliacao | false |
| LIDER DE COBRANCA | atendimento | true |
| LIDER DE COBRANCA | comprovante | true |
| LIDER DE COBRANCA | conciliacao | false |
| ASSISTENTE FINANCEIRO | atendimento | true |
| ASSISTENTE FINANCEIRO | comprovante | true |
| ASSISTENTE FINANCEIRO | conciliacao | true |
| GERENTE | atendimento | true |
| GERENTE | comprovante | true |
| GERENTE | conciliacao | true |

---

## BUCKETS STORAGE
Não definidos nas migrations. **Verificar manualmente no Supabase Dashboard.**

---

## INTEGRAÇÃO N8N → SUPABASE

### Code Node "Salvar no Buffer" (CRM Chat)
```javascript
// Usa this.helpers.httpRequest() para bypass TypeError do HTTP Request node v4.2
await this.helpers.httpRequest({
  method: 'POST',
  url: `${SUPABASE_URL}/rest/v1/message_buffer`,
  headers: {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: {
    user_id, message, file_name, file_type, file_data, processed: false
  }
});
```
- **Credenciais:** Supabase Service Role Key (hardcoded no workflow — **RISCO**)

---

## DASHBOARD API (/api/dashboard)
Consome:
- `funcionarios` (SELECT nome)
- `vendas` (SELECT *)
- `adimplencia` (SELECT usuario_baixa, homologado, valor_gerado)

Processa em memória (JS) para gerar rankings.

---

## CHECKLIST ESPECÍFICO (ETAPA 4)

| Item | Status |
|------|--------|
| `message_buffer` | ❌ **NÃO EXISTE** — requer migração 003 |
| `comprovantes` | ❌ **NÃO EXISTE** — requer migração 003 |
| `agentes_config` | ❌ **NÃO EXISTE** — requer migração 003 |
| `usuarios` | ⚠️ **PARCIAL** — `profiles` + `auth.users` (não tabela separada) |
| `chat_messages` | ✅ **EXISTE** (mig 001) |
| `funcionarios` | ✅ **EXISTE** (tabela base, mig 002 adiciona colunas) |
| `vendas` | ✅ **EXISTE** |
| `adimplencia` | ✅ **EXISTE** |

---

## RISCOS IDENTIFICADOS

| Risco | Impacto | Probabilidade |
|-------|---------|---------------|
| Migration 003 não aplicada | Buffer, Comprovantes, Agentes Config não funcionam | 100% (confirmado em TODO_NEXT.md) |
| Service Role Key hardcoded no n8n | Vazamento de credencial admin | Alta |
| RLS em `funcionarios`, `vendas`, `adimplencia` não definido | Possível exposição de dados sensíveis | Média |
| Sem buckets Storage definidos | Upload de avatar/comprovantes falhará | Média |
| `chat_messages` não tem índice em user_id + created_at | Queries lentas com histórico grande | Baixa |

---

**NENHUM ARQUIVO DO PROJETO FOI MODIFICADO.**