import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const PENDING_STATUSES = [
  "PENDENTE_SEM_CORRESPONDENCIA",
  "DIVERGENCIA_VALOR",
  "DIVERGENCIA_DATA",
  "DIVERGENCIA_VALOR_DATA",
  "AMBIGUO_MULTIPLOS_CANDIDATOS",
  "DUPLICADO",
  "DADOS_INSUFICIENTES",
  "PENDENTE_CONFERENCIA",
  "AGUARDANDO_DOCUMENTO",
]

export async function GET(req: Request) {
  try {
    const admin = createAdminClient()
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const tipo = url.searchParams.get("tipo") || ""
    const status = url.searchParams.get("status") || ""
    const offset = (page - 1) * limit

    let concQuery = admin
      .from("conciliacoes")
      .select(`*`, { count: "exact" })
      .in("status", PENDING_STATUSES)
      .order("created_at", { ascending: false })

    if (status && PENDING_STATUSES.includes(status)) {
      concQuery = concQuery.eq("status", status)
    }
    if (tipo && tipo !== "conciliacao") {
      concQuery = concQuery.is("id", null)
    }

    const { data: conciliacoes, error: concError, count: totalConc } = await concQuery
    if (concError) {
      return NextResponse.json({ error: concError.message }, { status: 500 })
    }

    let compQuery = admin
      .from("comprovantes")
      .select(`*`, { count: "exact" })
      .in("status", ["pendente", "conferencia"])
      .order("created_at", { ascending: false })
      .range(0, 49)

    if (tipo && tipo !== "comprovante") {
      compQuery = compQuery.is("id", null)
    }
    if (status === "pendente") {
      compQuery = compQuery.eq("status", "pendente")
    } else if (status === "conferencia") {
      compQuery = compQuery.eq("status", "conferencia")
    }

    const { data: comprovantes, error: compError, count: totalComp } = await compQuery
    if (compError) {
      return NextResponse.json({ error: compError.message }, { status: 500 })
    }

    const pendenciaItems = [
      ...(conciliacoes || []).map((c) => ({
        id: c.id,
        tipo: "conciliacao",
        tipoLabel: "Conciliação",
        identificador: c.id_importacao_a || c.id_importacao_b || c.id_comprovante || "",
        matricula: "",
        data: c.created_at,
        origem: c.regra_aplicada?.replace("REGRA_", "").replace(/_/g, " ") || "",
        valor: c.diferenca_valor ?? c.valor_origem ?? c.valor_destino,
        motivo: c.motivo || "",
        status: c.status,
        prioridade: prioridadePendencia(c.status),
        detalhes: c,
      })),
      ...(comprovantes || []).map((c) => ({
        id: c.id,
        tipo: "comprovante",
        tipoLabel: "Comprovante",
        identificador: c.nome_pagador || "",
        matricula: c.matriculas?.[0] || "",
        data: c.data_hora || c.created_at,
        origem: c.arquivo_drive_id ? "Documento" : "Upload",
        valor: c.valor,
        motivo: c.observacao || "",
        status: c.status,
        prioridade: c.status === "pendente" ? "media" : "baixa",
        detalhes: c,
      })),
    ]

    pendenciaItems.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    const total = (totalConc || 0) + (totalComp || 0)
    const paginated = pendenciaItems.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginated,
      total,
      page,
      limit,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}

function prioridadePendencia(status: string): string {
  if (status === "DIVERGENCIA_VALOR" || status === "DIVERGENCIA_VALOR_DATA") return "alta"
  if (status === "AGUARDANDO_DOCUMENTO" || status === "PENDENTE_SEM_CORRESPONDENCIA") return "media"
  if (status === "AMBIGUO_MULTIPLOS_CANDIDATOS" || status === "PENDENTE_CONFERENCIA") return "media"
  return "baixa"
}
