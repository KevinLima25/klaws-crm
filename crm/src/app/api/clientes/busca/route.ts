import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ClienteResult = {
  id: string
  tipo: "importacao" | "comprovante" | "conciliacao"
  matricula: string
  cpf: string | null
  nome: string | null
  data: string
}

function maskCpf(cpf: string | null): string | null {
  if (!cpf || cpf.length < 11) return cpf
  return cpf.replace(/^(\d{3})\d{5}(\d{2})$/, "$1*****$2")
}

export async function GET(req: Request) {
  const admin = createAdminClient()
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() || ""

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Informe pelo menos 2 caracteres" }, { status: 400 })
  }

  const results: ClienteResult[] = []
  const seen = new Set<string>()

  const exactMatricula = /^\d+$/.test(q)

  if (exactMatricula) {
    const { data: impByMat } = await admin
      .from("importacoes")
      .select("matricula, cpf, nome, created_at")
      .eq("matricula", q)
      .limit(20)

    if (impByMat) {
      for (const r of impByMat) {
        const key = `importacao-${r.matricula}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({
            id: `imp-${r.matricula}`,
            tipo: "importacao",
            matricula: r.matricula || q,
            cpf: maskCpf(r.cpf),
            nome: r.nome || null,
            data: r.created_at,
          })
        }
      }
    }
  }

  const cpfClean = q.replace(/\D/g, "")
  if (cpfClean.length >= 11) {
    const { data: impByCpf } = await admin
      .from("importacoes")
      .select("matricula, cpf, nome, created_at")
      .ilike("cpf", `%${cpfClean}%`)
      .limit(20)

    if (impByCpf) {
      for (const r of impByCpf) {
        const key = `cpf-${r.matricula || cpfClean}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({
            id: `cpf-${r.matricula || Math.random().toString(36).slice(2)}`,
            tipo: "importacao",
            matricula: r.matricula || "",
            cpf: maskCpf(r.cpf),
            nome: r.nome || null,
            data: r.created_at,
          })
        }
      }
    }
  }

  const { data: impByNome } = await admin
    .from("importacoes")
    .select("matricula, cpf, nome, created_at")
    .ilike("nome", `%${q}%`)
    .limit(20)

  if (impByNome) {
    for (const r of impByNome) {
      const key = `nome-${r.matricula || r.cpf || r.nome}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          id: `nome-${r.matricula || Math.random().toString(36).slice(2)}`,
          tipo: "importacao",
          matricula: r.matricula || "",
          cpf: maskCpf(r.cpf),
          nome: r.nome || null,
          data: r.created_at,
        })
      }
    }
  }

  const { data: compByNome } = await admin
    .from("comprovantes")
    .select("nome_pagador, valor, data_hora, matriculas")
    .ilike("nome_pagador", `%${q}%`)
    .limit(20)

  if (compByNome) {
    for (const r of compByNome) {
      const mat = Array.isArray(r.matriculas) ? r.matriculas[0] || "" : ""
      const key = `comp-${mat || r.nome_pagador}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          id: `comp-${mat || Math.random().toString(36).slice(2)}`,
          tipo: "comprovante",
          matricula: mat,
          cpf: null,
          nome: r.nome_pagador || null,
          data: r.data_hora || "",
        })
      }
    }
  }

  results.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  const grouped: Record<string, { nome: string | null; cpf: string | null; matriculas: string[]; totalRegistros: number; ultimaAtividade: string }> = {}

  for (const r of results) {
    const key = r.matricula || r.cpf || r.nome || r.id
    if (!grouped[key]) {
      grouped[key] = {
        nome: r.nome,
        cpf: r.cpf,
        matriculas: [],
        totalRegistros: 0,
        ultimaAtividade: r.data,
      }
    }
    if (r.matricula && !grouped[key].matriculas.includes(r.matricula)) {
      grouped[key].matriculas.push(r.matricula)
    }
    grouped[key].totalRegistros++
    if (r.data > grouped[key].ultimaAtividade) {
      grouped[key].ultimaAtividade = r.data
    }
  }

  const clientes = Object.entries(grouped).map(([key, info]) => ({
    id: key,
    ...info,
  }))

  return NextResponse.json({
    clientes: clientes.slice(0, 50),
    total: clientes.length,
  })
}
