import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = createAdminClient()

  const [funcRes, vendasRes, adimpRes] = await Promise.all([
    supabase.from("funcionarios").select("nome"),
    supabase.from("vendas").select("*"),
    supabase
      .from("adimplencia")
      .select("usuario_baixa, homologado, valor_gerado")
      .neq("usuario_baixa", "")
      .not("usuario_baixa", "is", null),
  ])

  if (vendasRes.error) return NextResponse.json({ error: vendasRes.error.message }, { status: 500 })
  if (adimpRes.error) return NextResponse.json({ error: adimpRes.error.message }, { status: 500 })

  const funcionarioNames = new Set(
    (funcRes.data || []).map((f: any) => f.nome.trim().toLowerCase())
  )

  const allVendas = vendasRes.data.filter((r: any) => r.promotor_vendas)

  const totalVendas = allVendas.reduce((s: number, v: any) => s + Number(v.vendas), 0)
  const totalHomologados = allVendas.reduce((s: number, v: any) => s + Number(v.homologados_totais), 0)

  const vendasRanking = allVendas
    .filter((r: any) => funcionarioNames.has(r.promotor_vendas.trim().toLowerCase()))
    .sort((a: any, b: any) => b.vendas - a.vendas)

  const adimpMap = new Map<string, { total: number; count: number; homologadoCount: number; naoHomologadoCount: number }>()
  let totalAdimp = 0
  for (const r of adimpRes.data) {
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

  return NextResponse.json({ vendasRanking, adimplenciaRanking, totais: { totalVendas, totalHomologados, totalAdimp } })
}
