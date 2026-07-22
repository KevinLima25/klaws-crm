# PROJECT STATE — Agente_Comprovante (WFCRM001comp01)

> Atualizado em: 22/07/2026 ~11:40
> Sprint: 1.7R — Refatoração para Nodes Nativos (Runner) + Correções de Integração CRM Chat

---

## Nodes Adicionados

| Node | Tipo | Função |
|------|------|--------|
| **TEM BINARIO?** | `n8n-nodes-base.if` v1 | Verifica `$json.tem_binario` para rotear entre fluxo binário e JSON-only |
| **Write Binary File** | `n8n-nodes-base.writeBinaryFile` v1 | Grava o arquivo binário no disco em `/home/node/.n8n-files/comprovantes/entrada/` |
| **Set Metadados** | `n8n-nodes-base.set` v3.4 | Define `arquivo_original`, `arquivo_salvo`, `timestamp` no item |

## Nodes Removidos (Candidatos)

Os seguintes nodes foram marcados como "Candidato à remoção" (substituídos por nodes nativos):

| Node | Motivo |
|------|--------|
| **GERAR HASH SHA256** | `require('crypto')` bloqueado pelo Runner |
| **GERAR ID COMPROVANTE** | `require('crypto')` bloqueado pelo Runner |
| **VERIFICAR DUPLICIDADE** | `require('fs')` bloqueado pelo Runner |
| **É DUPLICADO?** | IF node — mantido como candidato |
| **MOVER PARA DUPLICADOS** | `require('fs')` bloqueado pelo Runner |
| **RESPOSTA DUPLICADO** | Set node — mantido como candidato |
| **MOVER PARA PROCESSANDO** | `require('fs')` bloqueado pelo Runner |
| **GERAR METADATA** | `require('crypto')` bloqueado pelo Runner |
| **SALVAR METADATA** | `require('fs')` bloqueado pelo Runner |
| **MOVER PARA PROCESSADOS** | `require('fs')` bloqueado pelo Runner |

## Nodes Mantidos

| Node | Tipo | Função |
|------|------|--------|
| **Webhook Comprovante** | `n8n-nodes-base.webhook` v2 | POST `/webhook/comprovante`, responseMode: lastNode |
| **VALIDAR ARQUIVO** | `n8n-nodes-base.code` v1 | Valida extensão, detecta binário, computa `caminho_completo`. Sem `require()` |
| **Valido?** | `n8n-nodes-base.if` v1 | Roteia para erro se arquivo inválido |
| **RESPOSTA SUCESSO** | `n8n-nodes-base.set` v3.4 | Formata resposta success com `status`, `arquivo_original`, `arquivo_salvo`, `timestamp` |
| **RESPOSTA ERRO** | `n8n-nodes-base.set` v3.4 | Formata resposta erro com `status`, `erro`, `arquivo`, `data` |

## Fluxo Final

```
Webhook Comprovante (POST /webhook/comprovante)
  → VALIDAR ARQUIVO (Code: valida extensão + detecta binário + caminho_completo)
    → Valido? (IF)
        ├── True → TEM BINARIO? (IF)
        │   ├── True → Write Binary File (grava arquivo)
        │   │           → Set Metadados (arquivo_original, arquivo_salvo, timestamp)
        │   │             → RESPOSTA SUCESSO (formata resposta)
        │   └── False → Set Metadados (sem arquivo salvo)
        │               → RESPOSTA SUCESSO
        └── False → RESPOSTA ERRO (extensão inválida / sem arquivo)
```

## Caminho Utilizado para Gravação

```
/home/node/.n8n-files/comprovantes/entrada/{timestamp}_{nome_original}
```

- **Diretório base:** `/home/node/.n8n-files/` (padrão do `SecurityConfig.restrictFileAccessTo`)
- **Fora do n8n home:** Não conflita com `BLOCK_FILE_ACCESS_TO_N8N_FILES`
- **Persistência:** Diretório dentro do container (não volume-mapped)
- **Nome do arquivo:** `<Date.now()>_<nome_original.ext>`

## Por que não `/home/node/.n8n/comprovantes/`?

O n8n 2.30.7 possui `isFilePathBlocked()` que verifica:
1. Se o path está em `restrictedPaths` (n8nFolder = `/home/node/.n8n`) → BLOQUEIA
2. Se o padrão casa com `blockFilePatterns` → BLOQUEIA
3. Se o path está em `allowedPaths` (default: `~/.n8n-files`) → SE NÃO ESTIVER, BLOQUEIA

A única forma de escrever sem alterar docker-compose.yml é usar `~/.n8n-files`.

## Testes Executados

8 testes automatizados via `sprint17r.js`:

1. **PDF válido** — multipart com `comprovante.pdf` → espera `status=success`
2. **JPG válido** — multipart com `foto.jpg` → espera `status=success`
3. **PNG válido** — multipart com `imagem.png` → espera `status=success`
4. **Sem extensão** — multipart com `noext` → espera `status=erro`
5. **.exe inválido** — multipart com `virus.exe` → espera `status=erro`
6. **Sem arquivo (JSON)** — JSON body sem arquivo → espera `status=erro`
7. **JSON com file_name** — JSON com `file_name: "boleto.pdf"` → espera `status=success`
8. **Arquivo salvo no disco** — verifica arquivos via `docker exec` → espera >= 3 arquivos

## Resultado dos Testes

```
Pass: 8/8
Fail: 0/8
All tests passed!
```

| Teste | Status |
|-------|--------|
| PDF válido | PASS |
| JPG válido | PASS |
| PNG válido | PASS |
| Sem extensão | PASS |
| .exe inválido | PASS |
| Sem arquivo (JSON) | PASS |
| JSON com file_name (CRM Chat) | PASS |
| Arquivo salvo no disco | PASS (14 arquivos) |

## Observações Técnicas

### Write Binary File e `continueOnFail`
- Write Binary File usa flag `O_WRONLY | O_CREAT | O_TRUNC` (default)
- Sem `continueOnFail` — erro interrompe o workflow
- Após gravação, adiciona `fileName` ao JSON de saída

### Set v3.4 e `includeOtherFields`
- `includeOtherFields: true` é OBRIGATÓRIO para preservar campos de entrada
- `options.stripBinary: true` remove dados binários do JSON de saída
- Sem `includeOtherFields`, o Set node descarta TODOS os campos não listados

### Expressões em assignmentCollection
- `Date.now()` retorna timestamp numérico (funciona)
- `$now.toISOString()` retornava `null` — substituído por `Date.now()`

### Fluxo CRM Chat (JSON-only)
- CRM Chat envia JSON sem binário → `tem_binario=false`
- TEM BINARIO?[False] → Set Metadados (arquivo_salvo vazio) → RESPOSTA SUCESSO

---

## Correções de Integração CRM Chat (22/07)

### Problema 1: `.env.local` apontava para ngrok inexistente
`NEXT_PUBLIC_N8N_WEBHOOK_URL=https://thread-urologist-catching.ngrok-free.dev/webhook/crm-chat` — ngrok fora do ar. Corrigido para `http://localhost:5678/webhook/crm-chat`.

### Problema 2: `Detectar Comprovante` não extraía `file_name` do `$binary`
Quando o frontend envia multipart via FormData, o nome do arquivo fica em `$binary.files.fileName`. O node buscava apenas em `$json.body.file_name` (sempre `null` no multipart).

**Correção aplicada:**
- `Detectar Comprovante`: extrai `file_name`/`file_type` de `Object.keys($binary || {})` primeiro, fallback para `$json.body`
- `Salvar no Buffer`: mesma lógica — extrai de `$binary` se não encontrar em `$json.body`
- Ambos incluem `file_name` e `file_type` no JSON de saída para os nós seguintes

### Problema 3: `HTTP Request - Chamar Agente Comprovante` não encontrava `file_name`
Usava `$json.body._file_name || $json.body.file_name` — mas no multipart não existe `$json.body`. Corrigido para priorizar `$json.file_name` (adicionado pelo Detectar Comprovante) com fallback para `$json.body.*`.

### Teste Multipart (simulando frontend)
```
POST /webhook/crm-chat (multipart com comprovante.pdf)
  → Status: 200
  → Body: {"arquivo_original":"comprovante.pdf","arquivo_salvo":"","timestamp":...,"status":"success"}
```

### Nodes Modificados no CRM Chat (WFCRM001chat01)
| Node | Alteração |
|------|-----------|
| **Salvar no Buffer** | Adicionada extração de `file_name`/`file_type` do `$binary` |
| **Detectar Comprovante** | Adicionada extração de `$binary` + `file_name`/`file_type` no JSON de saída |
| **HTTP Request - Chamar Agente Comprovante** | Parâmetros priorizam `$json.file_name`/`$json.file_type` |

### Fluxo Completo Atual (CRM Chat → Agente Comprovante)
```
Frontend (FormData com "files")
  → Webhook /webhook/crm-chat ($binary.files.fileName = "comprovante.pdf")
  → Salvar no Buffer (extrai file_name do $binary, salva no Supabase)
  → Detectar Comprovante (extrai file_name do $binary, detecta keyword, emite file_name/file_type)
  → Router: Comprovante?[True]
      → HTTP Request (POST /webhook/comprovante com file_name, file_type, user_id, message)
        → Webhook Comprovante
          → VALIDAR ARQUIVO (valida extensão, tem_binario=false)
          → Valido?[True] → TEM BINARIO?[False]
            → Set Metadados → RESPOSTA SUCESSO
  → Resposta volta para o fluxo do CRM Chat
```
