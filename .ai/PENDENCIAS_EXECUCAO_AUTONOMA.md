# Pendências de Execução Autônoma

## Decisões de Negócio
- Dashboard: placeholders "Em breve" removidos — features não-planejadas na cadeia UX
- Timeline: vínculo prioritário por matrícula (nunca nome), com fallback para CPF

## Decisões Técnicas
- Dashboard API: RPC `get_conciliacao_status_counts` criada (migration 00009); fallback eliminado
- Timeline: consulta em duas chamadas separadas (id_importacao_a + id_importacao_b)
- Timeline: filtro `days=365` como padrão
- Infraestrutura Docker migrada para `C:\KLAWS\infrastructure` (INFRA 3.3)

## SQL Manual
- Migration 00009: `get_conciliacao_status_counts` RPC function criada

## Pendências Resolvidas (Review Gate UX 2.3)
1. ✅ RPC `get_conciliacao_status_counts` — migration 00009 criada, fallback eliminado do dashboard
2. ⏳ OCR `comprovantes.matriculas` — populado pelo N8N externamente; confirmação depende de validação em produção
3. ✅ Touch target botão olho (admin) — `min-h-11 min-w-11 md:min-h-0 md:min-w-0` aplicado
4. ⏳ Build local — depende de PATH do Windows (`&`); build funcional via PowerShell
5. ⏳ Timeline >100 eventos — backlog técnico, sem implementação

## Pendências para Próxima Revisão
1. Aplicar migration 00009 no banco Supabase (via dashboard SQL editor ou script)
2. N8N: workflow Agente Comprovante precisa ser ativado para popular `comprovantes.matriculas`
3. ngrok.exe removido do tracking; reinstalar via chocolatey/scoop se necessário

## Pendências de Infraestrutura (INFRA 3.3)
1. Migrar bind mounts para `C:\KLAWS\infrastructure\n8n\data`
2. Migrar bind mounts para `C:\KLAWS\infrastructure\waha\sessions`
3. Unificar redes `wahann_automation` e `klaws_automation`
4. Remover dependência do diretório `Downloads\Waha N&N`
5. Exportar workflows n8n antes da migração
