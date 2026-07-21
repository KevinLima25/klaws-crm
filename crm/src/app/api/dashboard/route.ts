import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { canSeeVendas, canSeeAdimplencia } from "@/lib/roles"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("cargo")
    .eq("id", user.id)
    .single()

  const cargo = profile?.cargo || user.user_metadata?.cargo || ""

  const canVendas = canSeeVendas(cargo)
  const canAdimp = canSeeAdimplencia(cargo)

  const [funcRes, vendasRes, adimpRes] = await Promise.all([
    admin.from("funcionarios").select("nome"),
    canVendas ? admin.from("vendas").select("*") : { data: [], error: null },
    canAdimp
      ? admin
          .from("adimplencia")
          .select("usuario_baixa, homologado, valor_gerado")
          .neq("usuario_baixa", "")
          .not("usuario_baixa", "is", null)
      : { data: [], error: null },
  ])

  const funcionarioNames = new Set(
    (funcRes.data || []).map((f: any) => f.nome.trim().toLowerCase())
  )

  let vendasRanking: any[] = []
  let totalVendas = 0
  let totalHomologados = 0

  if (canVendas && !vendasRes.error) {
    const allVendas = (vendasRes.data || []).filter((r: any) => r.promotor_vendas)
    totalVendas = allVendas.reduce((s: number, v: any) => s + Number(v.vendas), 0)
    totalHomologados = allVendas.reduce((s: number, v: any) => s + Number(v.homologados_totais), 0)
    vendasRanking = allVendas
      .filter((r: any) => funcionarioNames.has(r.promotor_vendas.trim().toLowerCase()))
      .sort((a: any, b: any) => b.vendas - a.vendas)
  }

  let adimplenciaRanking: any[] = []
  let totalAdimp = 0

  if (canAdimp && !adimpRes.error) {
    const adimpMap = new Map<string, { total: number; count: number; homologadoCount: number; naoHomologadoCount: number }>()
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

    adimplenciaRanking = Array.from(adimpMap.entries())
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
  }

  return NextResponse.json({
    vendasRanking,
    adimplenciaRanking,
    totais: { totalVendas, totalHomologados, totalAdimp },
    acesso: { vendas: canVendas, adimplencia: canAdimp },
  })
}
