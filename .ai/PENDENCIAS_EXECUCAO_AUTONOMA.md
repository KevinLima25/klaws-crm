# Pendências de Execução Autônoma

## Decisões de Negócio
- Dashboard: placeholders "Em breve" (Agenda, WhatsApp, OCR, Relatórios) removidos — decidido por serem features não-planejadas na cadeia UX
- Timeline: vínculo prioritário por matrícula (nunca nome), com fallback para CPF

## Decisões Técnicas
- Dashboard API: `.rpc("get_conciliacao_status_counts")` tentado como primeira opção; fallback para consulta individual por status caso RPC não exista
- Timeline: consulta em duas chamadas separadas (id_importacao_a + id_importacao_b) em vez de `.or()` complexo na Supabase API
- Timeline: filtro `days=365` como padrão para evitar explosion de dados

## SQL Manual (Nenhuma migration foi criada)
Nenhuma migration foi necessária nesta execução.

## Pendências para Revisão
1. Verificar se a RPC `get_conciliacao_status_counts` existe no banco — se não, a consulta fallback está em uso (mais lenta)
2. A build Next.js local não pode ser executada devido ao caractere `&` no PATH do Windows — impedimento conhecido
3. Revisar touch targets em modais de troca de senha (admin page) — botão de olho pode ser pequeno
4. Timeline: considerar paginação ou virtual scrolling se houver muitos eventos (>100)
5. Verificar se `comprovantes.matriculas` é populado corretamente pelo OCR para o match por matrícula funcionar
