import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

function dateFilter(period: string): string | null {
  if (period === "all") return null
  const days = parseInt(period) || 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const STATUS_LABELS: Record<string, string> = {
  CONCILIADO_EXATO: "Conciliado Exato",
  CONCILIADO_DOCUMENTO: "Conciliado por Documento",
  AGUARDANDO_DOCUMENTO: "Aguardando Documento",
  PENDENTE_SEM_CORRESPONDENCIA: "Pendente",
  DIVERGENCIA_VALOR: "Divergência Valor",
  DIVERGENCIA_DATA: "Divergência Data",
  DIVERGENCIA_VALOR_DATA: "Divergência Valor+Data",
  AMBIGUO_MULTIPLOS_CANDIDATOS: "Ambíguo",
  DUPLICADO: "Duplicado",
  DADOS_INSUFICIENTES: "Dados Insuficientes",
  PENDENTE_CONFERENCIA: "Pendente de Conferência",
}

const STATUS_COLORS: Record<string, string> = {
  CONCILIADO_EXATO: "emerald",
  CONCILIADO_DOCUMENTO: "green",
  AGUARDANDO_DOCUMENTO: "amber",
  PENDENTE_SEM_CORRESPONDENCIA: "slate",
  DIVERGENCIA_VALOR: "rose",
  DIVERGENCIA_DATA: "orange",
  DIVERGENCIA_VALOR_DATA: "red",
  AMBIGUO_MULTIPLOS_CANDIDATOS: "yellow",
  DUPLICADO: "purple",
  DADOS_INSUFICIENTES: "gray",
  PENDENTE_CONFERENCIA: "sky",
}

export async function GET(req: Request) {
  const admin = createAdminClient()
  const url = new URL(req.url)
  const period = url.searchParams.get("period") || "30"
  const statusFilter = url.searchParams.get("status") || undefined

  const since = dateFilter(period)

  function applyPeriod<T extends Record<string, any>>(
    q: any,
    dateCol: string
  ) {
    if (since) return q.gte(dateCol, since) as typeof q
    return q
  }

  const [funcRes, vendasRes, adimpRes, concStatusRes, importCountRes, comprovanteCountRes, recentImportsRes, recentComprovantesRes, recentConciliacoesRes] = await Promise.all([
    admin.from("funcionarios").select("nome"),
    admin.from("vendas").select("*"),
    admin
      .from("adimplencia")
      .select("usuario_baixa, homologado, valor_gerado")
      .neq("usuario_baixa", "")
      .not("usuario_baixa", "is", null),
    admin.rpc("get_conciliacao_status_counts" as any).select("*").then(r => r) as Promise<any>,
    admin.from("importacoes").select("id", { count: "exact", head: true }),
    admin.from("comprovantes").select("id", { count: "exact", head: true }),
    applyPeriod(
      admin.from("importacoes").select("id, origem, arquivo_nome, created_at, valor, nome").order("created_at", { ascending: false }).limit(5),
      "created_at"
    ),
    applyPeriod(
      admin.from("comprovantes").select("id, nome_pagador, valor, data_hora, status").order("data_hora", { ascending: false }).limit(5),
      "data_hora"
    ),
    applyPeriod(
      admin.from("conciliacoes").select("id, status, valor_origem, created_at, regra_aplicada").order("created_at", { ascending: false }).limit(10),
      "created_at"
    ),
  ])

  if (vendasRes.error) return NextResponse.json({ error: vendasRes.error.message }, { status: 500 })
  if (adimpRes.error) return NextResponse.json({ error: adimpRes.error.message }, { status: 500 })

  const funcionarioNames = new Set(
    (funcRes.data || []).map((f: any) => f.nome?.trim().toLowerCase()).filter(Boolean)
  )

  const allVendas = (vendasRes.data || []).filter((r: any) => r.promotor_vendas)

  const totalVendas = allVendas.reduce((s: number, v: any) => s + Number(v.vendas || 0), 0)
  const totalHomologados = allVendas.reduce((s: number, v: any) => s + Number(v.homologados_totais || 0), 0)

  const vendasRanking = allVendas
    .filter((r: any) => funcionarioNames.has(r.promotor_vendas.trim().toLowerCase()))
    .sort((a: any, b: any) => (b.vendas || 0) - (a.vendas || 0))

  const adimpMap = new Map<string, { total: number; count: number; homologadoCount: number; naoHomologadoCount: number }>()
  let totalAdimp = 0
  for (const r of adimpRes.data || []) {
    const nome = (r.usuario_baixa || "").trim()
    if (!nome) continue
    const valor = Number(r.valor_gerado) || 0
    totalAdimp += valor
    if (!adimpMap.has(nome)) adimpMap.set(nome, { total: 0, count: 0, homologadoCount: 0, naoHomologadoCount: 0 })
    const entry = adimpMap.get(nome)!
    entry.total += valor
    entry.count++
    if (r.homologado === "SIM") entry.homologadoCount++
    else entry.naoHomologadoCount++
  }

  const adimplenciaRanking = Array.from(adimpMap.entries())
    .map(([nome, dados]) => ({
      nome,
      total_gerado: dados.total,
      total_pagamentos: dados.count,
      homologados: dados.homologadoCount,
      nao_homologados: dados.naoHomologadoCount,
      taxa_homologacao: dados.count > 0 ? ((dados.homologadoCount / dados.count) * 100).toFixed(1) + "%" : "0%",
    }))
    .filter((r) => funcionarioNames.has(r.nome.trim().toLowerCase()))
    .sort((a, b) => b.total_gerado - a.total_gerado)

  let conciliationStatusCounts: Record<string, number> = {}
  if (concStatusRes.data && Array.isArray(concStatusRes.data)) {
    for (const row of concStatusRes.data) {
      conciliationStatusCounts[row.status] = row.count
    }
  }

  return NextResponse.json({
    vendasRanking,
    adimplenciaRanking,
    totais: { totalVendas, totalHomologados, totalAdimp },
    conciliationStatusCounts,
    conciliationStatusMeta: Object.fromEntries(
      Object.entries(STATUS_LABELS).map(([k, v]) => [k, { label: v, color: STATUS_COLORS[k] || "slate" }])
    ),
    totalImports: importCountRes.count || 0,
    totalComprovantes: comprovanteCountRes.count || 0,
    recentImports: recentImportsRes.data || [],
    recentComprovantes: recentComprovantesRes.data || [],
    recentConciliacoes: recentConciliacoesRes.data || [],
  })
}
