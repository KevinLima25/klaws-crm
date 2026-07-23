import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type TimelineEvent = {
  id: string
  tipo: string
  data: string
  resumo: string
  origem: string
  status: string | null
  valor: number | null
  link: string | null
  metadata: Record<string, any>
}

const STATUS_LABEL: Record<string, string> = {
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

function maskCpf(cpf: string | null): string | null {
  if (!cpf || cpf.length < 11) return cpf
  return cpf.replace(/^(\d{3})\d{5}(\d{2})$/, "$1*****$2")
}

export async function GET(req: Request) {
  const admin = createAdminClient()
  const url = new URL(req.url)
  const matricula = url.searchParams.get("matricula")?.trim() || null
  const cpf = url.searchParams.get("cpf")?.trim() || null
  const tipo = url.searchParams.get("tipo") || null
  const status = url.searchParams.get("status") || null
  const days = parseInt(url.searchParams.get("days") || "365")

  if (!matricula && !cpf) {
    return NextResponse.json({ error: "Informe matrícula ou CPF" }, { status: 400 })
  }

  const since = new Date()
  since.setDate(since.getDate() - days)

  const events: TimelineEvent[] = []

  // 1. Importações
  let importQuery = admin
    .from("importacoes")
    .select("id, matricula, cpf, nome, valor, data_pagamento, created_at, origem, arquivo_nome, observacao, documento")
    .gte("created_at", since.toISOString())

  if (matricula) {
    importQuery = importQuery.ilike("matricula", `%${matricula}%`)
  }
  if (cpf) {
    importQuery = importQuery.ilike("cpf", `%${cpf.replace(/\D/g, "")}%`)
  }

  const { data: importacoes, error: impErr } = await importQuery.order("created_at", { ascending: false })

  if (impErr) {
    return NextResponse.json({ error: impErr.message }, { status: 500 })
  }

  if (importacoes && !tipo) {
    for (const imp of importacoes) {
      events.push({
        id: `imp-${imp.id}`,
        tipo: "importacao",
        data: imp.created_at,
        resumo: `Importação de ${imp.arquivo_nome || "arquivo"} — ${imp.nome || "sem nome"}`,
        origem: imp.origem || "importacao",
        status: null,
        valor: imp.valor ? Number(imp.valor) : null,
        link: null,
        metadata: {
          matricula: imp.matricula,
          cpf: maskCpf(imp.cpf),
          documento: imp.documento,
          nome: imp.nome,
          data_pagamento: imp.data_pagamento,
          observacao: imp.observacao,
        },
      })
    }
  }

  // 2. Conciliações (via importações linked)
  if (importacoes && importacoes.length > 0 && (!tipo || tipo === "conciliacao")) {
    const importIds = importacoes.map((i: any) => i.id)

    const [concA, concB] = await Promise.all([
      admin.from("conciliacoes")
        .select("id, id_importacao_a, id_importacao_b, id_comprovante, status, regra_aplicada, valor_origem, valor_destino, diferenca_valor, data_origem, data_destino, motivo, lote_execucao, created_at")
        .in("id_importacao_a", importIds)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false }),
      admin.from("conciliacoes")
        .select("id, id_importacao_a, id_importacao_b, id_comprovante, status, regra_aplicada, valor_origem, valor_destino, diferenca_valor, data_origem, data_destino, motivo, lote_execucao, created_at")
        .in("id_importacao_b", importIds)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false }),
    ])

    const seen = new Set<string>()
    const conciliacoes = [...(concA.data || []), ...(concB.data || [])].filter((c: any) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })

    if (conciliacoes) {
      for (const c of conciliacoes as any[]) {
        if (status && c.status !== status) continue
        events.push({
          id: `conc-${c.id}`,
          tipo: "conciliacao",
          data: c.created_at,
          resumo: `Conciliação: ${STATUS_LABEL[c.status] || c.status}`,
          origem: "conciliacao",
          status: c.status,
          valor: c.valor_origem ? Number(c.valor_origem) : null,
          link: null,
          metadata: {
            regra: c.regra_aplicada,
            lote: c.lote_execucao,
            valor_origem: c.valor_origem,
            valor_destino: c.valor_destino,
            diferenca: c.diferenca_valor,
            data_origem: c.data_origem,
            data_destino: c.data_destino,
            motivo: c.motivo,
          },
        })
      }
    }
  }

  // 3. Comprovantes (via matriculas array)
  if (!tipo || tipo === "comprovante") {
    let compQuery = admin
      .from("comprovantes")
      .select("id, nome_pagador, valor, data_hora, status, matriculas, created_at, observacao")
      .gte("data_hora", since.toISOString())

    if (matricula) {
      compQuery = compQuery.contains("matriculas", [matricula])
    }
    if (cpf) {
      const { data: impCpf } = await admin
        .from("importacoes")
        .select("matricula")
        .ilike("cpf", `%${cpf.replace(/\D/g, "")}%`)
        .not("matricula", "is", null)
      const matriculasFromCpf = [...new Set((impCpf || []).map((i: any) => i.matricula).filter(Boolean))]
      if (matriculasFromCpf.length > 0) {
        compQuery = compQuery.contains("matriculas", matriculasFromCpf)
      }
    }

    const { data: comprovantes } = await compQuery.order("data_hora", { ascending: false })

    if (comprovantes) {
      for (const comp of comprovantes as any[]) {
        events.push({
          id: `comp-${comp.id}`,
          tipo: "comprovante",
          data: comp.data_hora || comp.created_at,
          resumo: `Comprovante — ${comp.nome_pagador || "sem pagador"}`,
          origem: "comprovante",
          status: comp.status || "pendente",
          valor: comp.valor ? Number(comp.valor) : null,
          link: null,
          metadata: {
            nome_pagador: comp.nome_pagador,
            matriculas: comp.matriculas,
            observacao: comp.observacao,
          },
        })
      }
    }
  }

  // Ordenar por data (mais recente primeiro)
  events.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return NextResponse.json({
    events,
    total: events.length,
    cliente: importacoes && importacoes.length > 0 ? {
      nome: importacoes[0].nome,
      matricula: importacoes[0].matricula,
      cpf: maskCpf(importacoes[0].cpf),
      totalImportacoes: importacoes.length,
    } : null,
  })
}
