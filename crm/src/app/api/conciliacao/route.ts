import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { executarConciliacao } from "@/lib/conciliacao"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const filtros = {
      origens: body.origens || undefined,
      data_inicio: body.data_inicio || undefined,
      data_fim: body.data_fim || undefined,
    }

    const resultado = await executarConciliacao(filtros)

    return NextResponse.json({
      status: "ok",
      sumario: resultado,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const admin = createAdminClient()
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const status = url.searchParams.get("status") || undefined
    const offset = (page - 1) * limit

    let query = admin
      .from("conciliacoes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      limit,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}
