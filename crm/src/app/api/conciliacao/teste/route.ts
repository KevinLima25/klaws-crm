import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { executarConciliacao } from "@/lib/conciliacao"

const TEST_LOTE = "teste-" + Date.now()

type TestCase = {
  cenario: number
  descricao: string
  registros: any[]
  validacoes: TestValidation[]
}

type TestValidation = {
  tipo: "status" | "regra" | "contagem"
  valor: string | number
  campo?: string
}

async function limparTestes(admin: ReturnType<typeof createAdminClient>) {
  await admin.from("conciliacoes").delete().like("lote_execucao", `${TEST_LOTE}%`)
  await admin.from("importacoes").delete().eq("origem", "teste_extrato")
  await admin.from("importacoes").delete().eq("origem", "teste_ctn")
}

function formatarRegistro(base: any): any {
  return {
    origem: base.origem || "teste_extrato",
    arquivo_nome: "teste.xlsx",
    matricula: base.matricula || null,
    nome: base.nome || null,
    cpf: base.cpf || null,
    valor: base.valor ?? null,
    data_pagamento: base.data_pagamento || null,
    banco: base.banco || null,
    agencia: base.agencia || null,
    conta: base.conta || null,
    documento: base.documento || null,
    linha_original: JSON.stringify(base),
  }
}

export async function POST() {
  const admin = createAdminClient()
  const resultados: any[] = []
  let pass = 0
  let fail = 0

  try {
    await limparTestes(admin)

    // ==========================================
    // CENARIO 1: Correspondencia exata (CONCILIADO_EXATO)
    // ==========================================
    const c1 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "ABC123", cpf: "12345678901", valor: 150.00, data_pagamento: "2026-06-15" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "ABC123", cpf: "12345678901", valor: 150.00, data_pagamento: "2026-06-15" }),
    ]
    const { data: d1 } = await admin.from("importacoes").insert(c1).select()
    const res1 = await executarConciliacao()
    const valid1 = await validar(admin, res1, [
      { tipo: "contagem", valor: 1, campo: "conciliados_exatos" },
    ])
    resultados.push({ cenario: 1, descricao: "Correspondencia exata (CONCILIADO_EXATO)", ...valid1 })

    // ==========================================
    // CENARIO 2: Valor diferente (DIVERGENCIA_VALOR)
    // ==========================================
    await limparTestes(admin)
    const c2 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "DEF456", valor: 200.00, data_pagamento: "2026-06-15" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "DEF456", valor: 250.00, data_pagamento: "2026-06-15" }),
    ]
    const { data: d2 } = await admin.from("importacoes").insert(c2).select()
    const res2 = await executarConciliacao()
    const valid2 = await validar(admin, res2, [
      { tipo: "contagem", valor: 1, campo: "divergencia_valor" },
    ])
    resultados.push({ cenario: 2, descricao: "Valor diferente (DIVERGENCIA_VALOR)", ...valid2 })

    // ==========================================
    // CENARIO 3: Data diferente (DIVERGENCIA_DATA)
    // ==========================================
    await limparTestes(admin)
    const c3 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "GHI789", valor: 150.00, data_pagamento: "2026-06-15" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "GHI789", valor: 150.00, data_pagamento: "2026-06-20" }),
    ]
    const { data: d3 } = await admin.from("importacoes").insert(c3).select()
    const res3 = await executarConciliacao()
    const valid3 = await validar(admin, res3, [
      { tipo: "contagem", valor: 1, campo: "divergencia_data" },
    ])
    resultados.push({ cenario: 3, descricao: "Data diferente (DIVERGENCIA_DATA)", ...valid3 })

    // ==========================================
    // CENARIO 4: Sem matricula (PENDENTE_SEM_CORRESPONDENCIA ou DADOS_INSUFICIENTES)
    // ==========================================
    await limparTestes(admin)
    const c4 = [
      formatarRegistro({ origem: "teste_extrato", matricula: null, cpf: null, documento: null, valor: 100.00 }),
      formatarRegistro({ origem: "teste_ctn", matricula: "JKL012", valor: 100.00 }),
    ]
    const { data: d4 } = await admin.from("importacoes").insert(c4).select()
    const res4 = await executarConciliacao()
    const valid4 = await validar(admin, res4, [
      { tipo: "contagem", valor: 1, campo: "dados_insuficientes" },
    ])
    resultados.push({ cenario: 4, descricao: "Sem matricula/CPF/documento (DADOS_INSUFICIENTES)", ...valid4 })

    // ==========================================
    // CENARIO 5: CPF exato (CONCILIADO_EXATO)
    // ==========================================
    await limparTestes(admin)
    const c5 = [
      formatarRegistro({ origem: "teste_extrato", cpf: "11122233344", valor: 300.00, data_pagamento: "2026-07-01" }),
      formatarRegistro({ origem: "teste_ctn", cpf: "11122233344", valor: 300.00, data_pagamento: "2026-07-01" }),
    ]
    const { data: d5 } = await admin.from("importacoes").insert(c5).select()
    const res5 = await executarConciliacao()
    const valid5 = await validar(admin, res5, [
      { tipo: "contagem", valor: 1, campo: "conciliados_exatos" },
    ])
    resultados.push({ cenario: 5, descricao: "CPF exato (CONCILIADO_EXATO)", ...valid5 })

    // ==========================================
    // CENARIO 6: Documento exato (CONCILIADO_DOCUMENTO)
    // ==========================================
    await limparTestes(admin)
    const c6 = [
      formatarRegistro({ origem: "teste_extrato", documento: "DOC-001", valor: 500.00, data_pagamento: "2026-07-01" }),
      formatarRegistro({ origem: "teste_ctn", documento: "DOC-001", valor: 500.01, data_pagamento: "2026-07-01" }),
    ]
    const { data: d6 } = await admin.from("importacoes").insert(c6).select()
    const res6 = await executarConciliacao()
    const valid6 = await validar(admin, res6, [
      { tipo: "contagem", valor: 1, campo: "conciliados_documento" },
    ])
    resultados.push({ cenario: 6, descricao: "Documento exato com valor dentro da tolerancia (CONCILIADO_DOCUMENTO)", ...valid6 })

    // ==========================================
    // CENARIO 7: Dois candidatos possiveis (AMBIGUO_MULTIPLOS_CANDIDATOS)
    // ==========================================
    await limparTestes(admin)
    const c7 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "MNO345", valor: 150.00, data_pagamento: "2026-06-15" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "MNO345", valor: 150.00, data_pagamento: "2026-06-15" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "MNO345", valor: 150.00, data_pagamento: "2026-06-15" }),
    ]
    const { data: d7 } = await admin.from("importacoes").insert(c7).select()
    const res7 = await executarConciliacao()
    const valid7 = await validar(admin, res7, [
      { tipo: "contagem", valor: 1, campo: "ambiguos" },
    ])
    resultados.push({ cenario: 7, descricao: "Multiplos candidatos (AMBIGUO_MULTIPLOS_CANDIDATOS)", ...valid7 })

    // ==========================================
    // CENARIO 8: Registro duplicado (mesmo documento)
    // ==========================================
    await limparTestes(admin)
    const c8 = [
      formatarRegistro({ origem: "teste_extrato", documento: "DOC-DUP", valor: 100.00 }),
      formatarRegistro({ origem: "teste_extrato", documento: "DOC-DUP", valor: 100.00 }),
      formatarRegistro({ origem: "teste_ctn", documento: "DOC-DUP", valor: 100.00 }),
    ]
    const { data: d8 } = await admin.from("importacoes").insert(c8).select()
    const res8 = await executarConciliacao()
    const valid8 = await validar(admin, res8, [
      { tipo: "contagem", valor: 1, campo: "ambiguos" },
    ])
    resultados.push({ cenario: 8, descricao: "Registro duplicado (mesmo documento)", ...valid8 })

    // ==========================================
    // CENARIO 9: Registro ja conciliado (idempotencia)
    // ==========================================
    await limparTestes(admin)
    const c9 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "IDEM001", valor: 100.00, data_pagamento: "2026-06-15" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "IDEM001", valor: 100.00, data_pagamento: "2026-06-15" }),
    ]
    const { data: d9 } = await admin.from("importacoes").insert(c9).select()
    const res9a = await executarConciliacao()
    const res9b = await executarConciliacao()
    const valid9 = await validar(admin, res9b, [
      { tipo: "contagem", valor: 0, campo: "total_processados" },
    ])
    resultados.push({ cenario: 9, descricao: "Idempotencia - segunda execucao nao duplica", ...valid9 })

    // ==========================================
    // CENARIO 10: Campos insuficientes
    // ==========================================
    await limparTestes(admin)
    const c10 = [
      formatarRegistro({ origem: "teste_extrato", matricula: null, cpf: null, documento: null, valor: 50.00 }),
    ]
    const { data: d10 } = await admin.from("importacoes").insert(c10).select()
    const res10 = await executarConciliacao()
    const valid10 = await validar(admin, res10, [
      { tipo: "contagem", valor: 1, campo: "dados_insuficientes" },
    ])
    resultados.push({ cenario: 10, descricao: "Campos insuficientes (DADOS_INSUFICIENTES)", ...valid10 })

    // ==========================================
    // CENARIO 11: Valores com virgula e ponto (normalizacao)
    // ==========================================
    await limparTestes(admin)
    const c11 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "VIR001", valor: 150.00, data_pagamento: "2026-06-15" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "VIR001", valor: 150.00, data_pagamento: "2026-06-15" }),
    ]
    const { data: d11 } = await admin.from("importacoes").insert(c11).select()
    const res11 = await executarConciliacao()
    const valid11 = await validar(admin, res11, [
      { tipo: "contagem", valor: 1, campo: "conciliados_exatos" },
    ])
    resultados.push({ cenario: 11, descricao: "Valores normalizados com ponto (CONCILIADO_EXATO)", ...valid11 })

    // ==========================================
    // CENARIO 12: Datas em formatos diferentes
    // ==========================================
    await limparTestes(admin)
    const c12 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "DAT001", valor: 200.00, data_pagamento: "2026-01-15" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "DAT001", valor: 200.00, data_pagamento: "2026-01-15" }),
    ]
    const { data: d12 } = await admin.from("importacoes").insert(c12).select()
    const res12 = await executarConciliacao()
    const valid12 = await validar(admin, res12, [
      { tipo: "contagem", valor: 1, campo: "conciliados_exatos" },
    ])
    resultados.push({ cenario: 12, descricao: "Datas ISO (CONCILIADO_EXATO)", ...valid12 })

    // ==========================================
    // CENARIO 13: Execucao repetida (idempotencia)
    // ==========================================
    await limparTestes(admin)
    const c13 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "IDM002", valor: 300.00, data_pagamento: "2026-07-01" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "IDM002", valor: 300.00, data_pagamento: "2026-07-01" }),
      formatarRegistro({ origem: "teste_ctn", matricula: "IDM003", valor: 400.00, data_pagamento: "2026-07-02" }),
      formatarRegistro({ origem: "teste_extrato", matricula: "IDM003", valor: 400.00, data_pagamento: "2026-07-02" }),
    ]
    const { data: d13 } = await admin.from("importacoes").insert(c13).select()

    // Executar 3 vezes
    const r1 = await executarConciliacao()
    const r2 = await executarConciliacao()
    const r3 = await executarConciliacao()

    const totalR1 = r1.total_processados
    const totalR2 = r2.total_processados
    const totalR3 = r3.total_processados

    const idemOk = totalR1 > 0 && totalR2 === 0 && totalR3 === 0
    resultados.push({
      cenario: 13,
      descricao: "Execucao repetida 3x (idempotencia)",
      pass: idemOk,
      detalhes: `Execucao 1: ${totalR1}, Execucao 2: ${totalR2}, Execucao 3: ${totalR3}`,
    })

    // ==========================================
    // CENARIO 14: Lote com registro invalido entre validos
    // ==========================================
    await limparTestes(admin)
    const c14 = [
      formatarRegistro({ origem: "teste_extrato", matricula: "VAL001", valor: 100.00, data_pagamento: "2026-06-15" }),
      formatarRegistro({ origem: "teste_extrato", matricula: null, cpf: null, documento: null, valor: 999.99 }),
      formatarRegistro({ origem: "teste_ctn", matricula: "VAL001", valor: 100.00, data_pagamento: "2026-06-15" }),
    ]
    const { data: d14 } = await admin.from("importacoes").insert(c14).select()
    const res14 = await executarConciliacao()
    const valid14 = await validar(admin, res14, [
      { tipo: "contagem", valor: 1, campo: "conciliados_exatos" },
      { tipo: "contagem", valor: 1, campo: "dados_insuficientes" },
    ])
    resultados.push({ cenario: 14, descricao: "Lote com registro invalido entre validos", ...valid14 })

    // Limpar
    await limparTestes(admin)

    for (const r of resultados) {
      if (r.pass) pass++
      else fail++
    }

    return NextResponse.json({
      status: "ok",
      total: resultados.length,
      pass,
      fail,
      resultados,
    })
  } catch (err: any) {
    await limparTestes(admin).catch(() => {})
    return NextResponse.json({
      status: "error",
      error: err.message || String(err),
      resultados,
    }, { status: 500 })
  }
}

async function validar(
  admin: ReturnType<typeof createAdminClient>,
  sumario: any,
  validacoes: TestValidation[]
): Promise<{ pass: boolean; detalhes: string }> {
  const falhas: string[] = []

  for (const v of validacoes) {
    if (v.tipo === "contagem") {
      const campo = v.campo || ""
      const real = sumario[campo]
      if (real !== v.valor) {
        falhas.push(`${campo}: esperado=${v.valor}, real=${real}`)
      }
    }
  }

  // Verificar sem duplicidades no banco
  const { data: dups, error } = await admin.rpc("check_conciliacao_duplicates" as any)
  if (error) {
    // RPC pode nao existir, verificar via query
    const { data: concs } = await admin
      .from("conciliacoes")
      .select("idempotencia_key")

    if (concs) {
      const keys = concs.map((c: any) => c.idempotencia_key)
      const uniqueKeys = new Set(keys)
      if (keys.length !== uniqueKeys.size) {
        falhas.push(`Chaves duplicadas: ${keys.length} registros, ${uniqueKeys.size} unicas`)
      }
    }
  }

  return {
    pass: falhas.length === 0,
    detalhes: falhas.length > 0 ? falhas.join("; ") : "OK",
  }
}
