import { createAdminClient } from "@/lib/supabase/admin"

// ========================================
// TOLERANCIAS (PENDENTE DE APROVACAO)
// ========================================
const TOLERANCIA_MONETARIA = 0.02
const TOLERANCIA_DATA_DIAS = 1
const TIMEZONE = "America/Sao_Paulo"

// ========================================
// CAMPOS MINIMOS PARA CONCILIACAO
// ========================================
const CAMPOS_IDENTIFICACAO = ["matricula", "cpf", "documento"] as const

// ========================================
// TIPOS
// ========================================

export type StatusConciliacao =
  | "CONCILIADO_EXATO"
  | "CONCILIADO_DOCUMENTO"
  | "PENDENTE_SEM_CORRESPONDENCIA"
  | "DIVERGENCIA_VALOR"
  | "DIVERGENCIA_DATA"
  | "DIVERGENCIA_VALOR_DATA"
  | "AMBIGUO_MULTIPLOS_CANDIDATOS"
  | "DUPLICADO"
  | "DADOS_INSUFICIENTES"
  | "PENDENTE_CONFERENCIA"

export type RegraAplicada =
  | "REGRA_A_CONCILIADO_EXATO"
  | "REGRA_B_CONCILIADO_DOCUMENTO"
  | "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA"
  | "REGRA_D_DIVERGENCIA_VALOR"
  | "REGRA_E_DIVERGENCIA_DATA"
  | "REGRA_F_AMBIGUO_MULTIPLOS"
  | "REGRA_G_DUPLICADO"
  | "REGRA_H_DADOS_INSUFICIENTES"

export type ImportRow = {
  id: string
  origem: string
  arquivo_nome: string
  matricula: string | null
  nome: string | null
  cpf: string | null
  valor: number | null
  data_pagamento: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  documento: string | null
  linha_original: string | null
  observacao: string | null
}

export type CandidateMatch = {
  record: ImportRow
  keyField: string
  keyValue: string
}

export type ConciliacaoResult = {
  id_importacao_a: string | null
  id_importacao_b: string | null
  status: StatusConciliacao
  regra_aplicada: RegraAplicada
  campos_comparados: Record<string, any>
  divergencias: Record<string, any>
  valor_origem: number | null
  valor_destino: number | null
  diferenca_valor: number | null
  data_origem: string | null
  data_destino: string | null
  idempotencia_key: string
  motivo: string | null
}

export type FiltrosConciliacao = {
  origens?: string[]
  data_inicio?: string
  data_fim?: string
}

export type SumarioConciliacao = {
  lote_execucao: string
  total_processados: number
  conciliados_exatos: number
  conciliados_documento: number
  pendentes_sem_correspondencia: number
  divergencia_valor: number
  divergencia_data: number
  divergencia_valor_data: number
  ambiguos: number
  duplicados: number
  dados_insuficientes: number
  erros: string[]
  executado_em: string
}

// ========================================
// HELPERS
// ========================================

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100
}

function normalizarMatricula(v: string | null): string | null {
  if (!v) return null
  return v.toUpperCase().replace(/[^\w]/g, "").trim() || null
}

function normalizarDocumento(v: string | null): string | null {
  if (!v) return null
  return v.trim().replace(/\s+/g, "") || null
}

function diffValor(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null
  return arredondar(Math.abs(a - b))
}

function diffData(a: string | null, b: string | null): number | null {
  if (!a || !b) return null
  const d1 = new Date(a + "T00:00:00-03:00")
  const d2 = new Date(b + "T00:00:00-03:00")
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null
  return Math.abs((d2.getTime() - d1.getTime()) / 86400000)
}

function idempotenciaKey(aId: string | null, bId: string | null, status: string): string {
  if (aId && bId) {
    const [minId, maxId] = aId < bId ? [aId, bId] : [bId, aId]
    return `${minId}:${maxId}:${status}`
  }
  return `${aId || bId}:${status}`
}

function temCamposMinimos(row: ImportRow): boolean {
  return CAMPOS_IDENTIFICACAO.some((campo) => {
    const val = row[campo]
    return val !== null && val !== undefined && String(val).trim() !== ""
  })
}

// ========================================
// MOTOR
// ========================================

export async function executarConciliacao(
  filtros?: FiltrosConciliacao
): Promise<SumarioConciliacao> {
  const admin = createAdminClient()
  const loteExecucao = crypto.randomUUID()
  const erros: string[] = []

  const sumario: SumarioConciliacao = {
    lote_execucao: loteExecucao,
    total_processados: 0,
    conciliados_exatos: 0,
    conciliados_documento: 0,
    pendentes_sem_correspondencia: 0,
    divergencia_valor: 0,
    divergencia_data: 0,
    divergencia_valor_data: 0,
    ambiguos: 0,
    duplicados: 0,
    dados_insuficientes: 0,
    erros: [],
    executado_em: new Date().toISOString(),
  }

  try {
    // 1. Carregar registros nao processados
    const { data: processados, error: errProc } = await admin
      .from("conciliacoes")
      .select("id_importacao_a, id_importacao_b")
      .in("status", [
        "CONCILIADO_EXATO",
        "CONCILIADO_DOCUMENTO",
        "DIVERGENCIA_VALOR",
        "DIVERGENCIA_DATA",
        "DIVERGENCIA_VALOR_DATA",
        "AMBIGUO_MULTIPLOS_CANDIDATOS",
      ])

    if (errProc) {
      erros.push(`Erro ao carregar conciliacoes existentes: ${errProc.message}`)
      sumario.erros = erros
      return sumario
    }

    const idsUsados = new Set<string>()
    for (const c of processados || []) {
      if (c.id_importacao_a) idsUsados.add(c.id_importacao_a)
      if (c.id_importacao_b) idsUsados.add(c.id_importacao_b)
    }

    // 2. Carregar registros de importacao
    let query = admin.from("importacoes").select("*")

    if (filtros?.origens && filtros.origens.length > 0) {
      query = query.in("origem", filtros.origens)
    }
    if (filtros?.data_inicio) {
      query = query.gte("data_pagamento", filtros.data_inicio)
    }
    if (filtros?.data_fim) {
      query = query.lte("data_pagamento", filtros.data_fim)
    }

    const { data: importacoes, error: errImp } = await query

    if (errImp) {
      erros.push(`Erro ao carregar importacoes: ${errImp.message}`)
      sumario.erros = erros
      return sumario
    }

    if (!importacoes || importacoes.length === 0) {
      sumario.erros = erros
      return sumario
    }

    // Filtrar registros ja processados
    const pendentes = (importacoes as ImportRow[]).filter((r) => !idsUsados.has(r.id))

    // 3. Agrupar por origem
    const grupos = new Map<string, ImportRow[]>()
    for (const row of pendentes) {
      const grupo = grupos.get(row.origem) || []
      grupo.push(row)
      grupos.set(row.origem, grupo)
    }

    const origensUnicas = Array.from(grupos.keys())

    if (origensUnicas.length < 2) {
      // So uma origem: marcar todos como PENDENTE_SEM_CORRESPONDENCIA
      const results = pendentes.map((r) => classificarRegistroSemPar(r, loteExecucao))
      await salvarResultados(admin, results, sumario)
      sumario.erros = erros
      return sumario
    }

    // 4. Construir indices para cada grupo
    type Indices = {
      porMatricula: Map<string, ImportRow[]>
      porCpf: Map<string, ImportRow[]>
      porDocumento: Map<string, ImportRow[]>
    }

    const indicesPorOrigem = new Map<string, Indices>()
    for (const [origem, rows] of grupos) {
      const indices: Indices = {
        porMatricula: new Map(),
        porCpf: new Map(),
        porDocumento: new Map(),
      }
      for (const row of rows) {
        const mat = normalizarMatricula(row.matricula)
        if (mat) {
          const arr = indices.porMatricula.get(mat) || []
          arr.push(row)
          indices.porMatricula.set(mat, arr)
        }
        if (row.cpf) {
          const arr = indices.porCpf.get(row.cpf) || []
          arr.push(row)
          indices.porCpf.set(row.cpf, arr)
        }
        const doc = normalizarDocumento(row.documento)
        if (doc) {
          const arr = indices.porDocumento.get(doc) || []
          arr.push(row)
          indices.porDocumento.set(doc, arr)
        }
      }
      indicesPorOrigem.set(origem, indices)
    }

    // 5. Para cada par de origens, conciliar
    const resultados: ConciliacaoResult[] = []
    const jaPareados = new Set<string>()

    for (let i = 0; i < origensUnicas.length; i++) {
      for (let j = i + 1; j < origensUnicas.length; j++) {
        const origemA = origensUnicas[i]
        const origemB = origensUnicas[j]
        const grupoA = grupos.get(origemA)!
        const grupoB = grupos.get(origemB)!
        const indicesB = indicesPorOrigem.get(origemB)!

        const resultadosPar = conciliarPar(
          grupoA,
          origemA,
          indicesB,
          origemB,
          loteExecucao,
          jaPareados
        )
        resultados.push(...resultadosPar)
      }
    }

    // 6. Registros sem par
    for (const row of pendentes) {
      if (!jaPareados.has(row.id)) {
        const result = classificarRegistroSemPar(row, loteExecucao)
        resultados.push(result)
      }
    }

    // 7. Salvar
    await salvarResultados(admin, resultados, sumario)
    sumario.erros = erros
    return sumario
  } catch (e: any) {
    erros.push(`Erro inesperado: ${e.message || String(e)}`)
    sumario.erros = erros
    return sumario
  }
}

// ========================================
// CONCILIACAO ENTRE DOIS GRUPOS
// ========================================

function conciliarPar(
  grupoA: ImportRow[],
  origemA: string,
  indicesB: {
    porMatricula: Map<string, ImportRow[]>
    porCpf: Map<string, ImportRow[]>
    porDocumento: Map<string, ImportRow[]>
  },
  origemB: string,
  loteExecucao: string,
  jaPareados: Set<string>
): ConciliacaoResult[] {
  const resultados: ConciliacaoResult[] = []

  for (const rowA of grupoA) {
    if (jaPareados.has(rowA.id)) continue

    // H) Campos insuficientes
    if (!temCamposMinimos(rowA)) {
      resultados.push({
        id_importacao_a: rowA.id,
        id_importacao_b: null,
        status: "DADOS_INSUFICIENTES",
        regra_aplicada: "REGRA_H_DADOS_INSUFICIENTES",
        campos_comparados: { matricula: rowA.matricula, cpf: rowA.cpf, documento: rowA.documento },
        divergencias: {},
        valor_origem: rowA.valor,
        valor_destino: null,
        diferenca_valor: null,
        data_origem: rowA.data_pagamento,
        data_destino: null,
        idempotencia_key: idempotenciaKey(rowA.id, null, "DADOS_INSUFICIENTES"),
        motivo: "Registro sem matricula, CPF ou documento para identificacao",
      })
      jaPareados.add(rowA.id)
      continue
    }

    // G) Duplicado: documento ja usado em outra conciliacao (verificado no carregamento inicial)

    // Buscar candidatos
    const candidatos = buscarCandidatos(rowA, indicesB)

    // Filtrar candidatos ja pareados
    const candidatosDisponiveis = candidatos.filter((c) => !jaPareados.has(c.record.id))

    if (candidatosDisponiveis.length === 0) {
      // C) Sem correspondencia
      resultados.push({
        id_importacao_a: rowA.id,
        id_importacao_b: null,
        status: "PENDENTE_SEM_CORRESPONDENCIA",
        regra_aplicada: "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA",
        campos_comparados: {},
        divergencias: {},
        valor_origem: rowA.valor,
        valor_destino: null,
        diferenca_valor: null,
        data_origem: rowA.data_pagamento,
        data_destino: null,
        idempotencia_key: idempotenciaKey(rowA.id, null, "PENDENTE_SEM_CORRESPONDENCIA"),
        motivo: `Nenhum candidato encontrado na origem '${origemB}'`,
      })
      jaPareados.add(rowA.id)
      continue
    }

    // Avaliar cada candidato contra as regras
    const matchesPorRegra = new Map<
      string,
      { candidate: ImportRow; status: StatusConciliacao; regra: RegraAplicada; divergencias: Record<string, any> }[]
    >()

    for (const candidate of candidatosDisponiveis) {
      const avaliacao = avaliarRegras(rowA, candidate.record)
      if (avaliacao) {
        const arr = matchesPorRegra.get(avaliacao.regra) || []
        arr.push({ candidate: candidate.record, ...avaliacao })
        matchesPorRegra.set(avaliacao.regra, arr)
      }
    }

    // Aplicar regras em ordem de prioridade
    const ordemRegras: RegraAplicada[] = [
      "REGRA_A_CONCILIADO_EXATO",
      "REGRA_B_CONCILIADO_DOCUMENTO",
      "REGRA_D_DIVERGENCIA_VALOR",
      "REGRA_E_DIVERGENCIA_DATA",
    ]

    let matched = false

    for (const regra of ordemRegras) {
      const matches = matchesPorRegra.get(regra)
      if (!matches || matches.length === 0) continue

      if (matches.length === 1) {
        const m = matches[0]
        const divs: Record<string, any> = { ...m.divergencias }

        if (
          m.status === "DIVERGENCIA_VALOR" &&
          matchesPorRegra.has("REGRA_E_DIVERGENCIA_DATA")
        ) {
          // Verificar se tambem ha divergencia de data com o mesmo candidato
          const dataDivs = matchesPorRegra.get("REGRA_E_DIVERGENCIA_DATA") || []
          const sameCandidate = dataDivs.find((d) => d.candidate.id === m.candidate.id)
          if (sameCandidate) {
            m.status = "DIVERGENCIA_VALOR_DATA" as StatusConciliacao
            Object.assign(divs, sameCandidate.divergencias)
          }
        }

        resultados.push({
          id_importacao_a: rowA.id,
          id_importacao_b: m.candidate.id,
          status: m.status,
          regra_aplicada: m.regra,
          campos_comparados: {
            origem_a: rowA.origem,
            origem_b: m.candidate.origem,
            matricula_a: rowA.matricula,
            matricula_b: m.candidate.matricula,
            cpf_a: rowA.cpf,
            cpf_b: m.candidate.cpf,
            documento_a: rowA.documento,
            documento_b: m.candidate.documento,
          },
          divergencias: divs,
          valor_origem: rowA.valor,
          valor_destino: m.candidate.valor,
          diferenca_valor: diffValor(rowA.valor, m.candidate.valor),
          data_origem: rowA.data_pagamento,
          data_destino: m.candidate.data_pagamento,
          idempotencia_key: idempotenciaKey(rowA.id, m.candidate.id, m.status),
          motivo: null,
        })

        jaPareados.add(rowA.id)
        jaPareados.add(m.candidate.id)
        matched = true
        break
      } else {
        // F) Multiplos candidatos
        resultados.push({
          id_importacao_a: rowA.id,
          id_importacao_b: null,
          status: "AMBIGUO_MULTIPLOS_CANDIDATOS",
          regra_aplicada: "REGRA_F_AMBIGUO_MULTIPLOS",
          campos_comparados: {
            regra_avaliada: regra,
            candidatos_ids: matches.map((m) => m.candidate.id),
          },
          divergencias: {},
          valor_origem: rowA.valor,
          valor_destino: null,
          diferenca_valor: null,
          data_origem: rowA.data_pagamento,
          data_destino: null,
          idempotencia_key: idempotenciaKey(rowA.id, null, "AMBIGUO_MULTIPLOS_CANDIDATOS"),
          motivo: `${matches.length} candidatos atendem a ${regra}`,
        })
        jaPareados.add(rowA.id)
        matched = true
        break
      }
    }

    if (!matched) {
      // C) Nenhum candidato atendeu as regras deterministicas
      resultados.push({
        id_importacao_a: rowA.id,
        id_importacao_b: null,
        status: "PENDENTE_SEM_CORRESPONDENCIA",
        regra_aplicada: "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA",
        campos_comparados: {
          candidatos_encontrados: candidatosDisponiveis.length,
        },
        divergencias: {},
        valor_origem: rowA.valor,
        valor_destino: null,
        diferenca_valor: null,
        data_origem: rowA.data_pagamento,
        data_destino: null,
        idempotencia_key: idempotenciaKey(rowA.id, null, "PENDENTE_SEM_CORRESPONDENCIA"),
        motivo: `${candidatosDisponiveis.length} candidato(s) encontrado(s) mas nenhum atendeu as regras deterministicas`,
      })
      jaPareados.add(rowA.id)
    }
  }

  return resultados
}

// ========================================
// BUSCA DE CANDIDATOS
// ========================================

function buscarCandidatos(
  row: ImportRow,
  indices: {
    porMatricula: Map<string, ImportRow[]>
    porCpf: Map<string, ImportRow[]>
    porDocumento: Map<string, ImportRow[]>
  }
): CandidateMatch[] {
  const encontrados = new Map<string, CandidateMatch>()

  const mat = normalizarMatricula(row.matricula)
  if (mat) {
    const matches = indices.porMatricula.get(mat)
    if (matches) {
      for (const m of matches) {
        encontrados.set(m.id, { record: m, keyField: "matricula", keyValue: mat })
      }
    }
  }

  if (row.cpf) {
    const matches = indices.porCpf.get(row.cpf)
    if (matches) {
      for (const m of matches) {
        if (!encontrados.has(m.id)) {
          encontrados.set(m.id, { record: m, keyField: "cpf", keyValue: row.cpf })
        }
      }
    }
  }

  const doc = normalizarDocumento(row.documento)
  if (doc) {
    const matches = indices.porDocumento.get(doc)
    if (matches) {
      for (const m of matches) {
        if (!encontrados.has(m.id)) {
          encontrados.set(m.id, { record: m, keyField: "documento", keyValue: doc })
        }
      }
    }
  }

  return Array.from(encontrados.values())
}

// ========================================
// AVALIACAO DE REGRAS CONTRA CANDIDATO
// ========================================

function avaliarRegras(rowA: ImportRow, rowB: ImportRow): {
  status: StatusConciliacao
  regra: RegraAplicada
  divergencias: Record<string, any>
} | null {
  const keyMatricula =
    normalizarMatricula(rowA.matricula) !== null &&
    normalizarMatricula(rowA.matricula) === normalizarMatricula(rowB.matricula)
  const keyCpf = rowA.cpf !== null && rowA.cpf === rowB.cpf
  const keyDocumento =
    normalizarDocumento(rowA.documento) !== null &&
    normalizarDocumento(rowA.documento) === normalizarDocumento(rowB.documento)

  const hasKeyMatch = keyMatricula || keyCpf || keyDocumento

  if (!hasKeyMatch && !keyDocumento) {
    return null
  }

  const dVal = diffValor(rowA.valor, rowB.valor)
  const dDat = diffData(rowA.data_pagamento, rowB.data_pagamento)

  const valorExato = rowA.valor !== null && rowB.valor !== null && dVal === 0
  const valorCompativel = dVal !== null && dVal <= TOLERANCIA_MONETARIA
  const dataExata = rowA.data_pagamento !== null && rowB.data_pagamento !== null && dDat === 0
  const dataCompativel = dDat !== null && dDat <= TOLERANCIA_DATA_DIAS

  const divergencias: Record<string, any> = {}

  // A) CONCILIADO_EXATO: key match + valor exato + data exata
  if ((keyMatricula || keyCpf) && valorExato && dataExata) {
    return {
      status: "CONCILIADO_EXATO",
      regra: "REGRA_A_CONCILIADO_EXATO",
      divergencias: {},
    }
  }

  // B) CONCILIADO_DOCUMENTO: documento match + valor compativel
  if (keyDocumento && valorCompativel) {
    if (dVal !== 0) {
      divergencias.valor = {
        origem: rowA.valor,
        destino: rowB.valor,
        diferenca: dVal,
        dentro_tolerancia: true,
      }
    }
    return {
      status: "CONCILIADO_DOCUMENTO",
      regra: "REGRA_B_CONCILIADO_DOCUMENTO",
      divergencias,
    }
  }

  // D) DIVERGENCIA_VALOR: key match + valor diferente
  if ((keyMatricula || keyCpf || keyDocumento) && dVal !== null && !valorCompativel) {
    divergencias.valor = {
      origem: rowA.valor,
      destino: rowB.valor,
      diferenca: dVal,
      dentro_tolerancia: false,
    }
    return {
      status: "DIVERGENCIA_VALOR",
      regra: "REGRA_D_DIVERGENCIA_VALOR",
      divergencias,
    }
  }

  // E) DIVERGENCIA_DATA: key match + data diferente + valor compativel
  if ((keyMatricula || keyCpf) && valorCompativel && dDat !== null && !dataCompativel) {
    divergencias.data = {
      origem: rowA.data_pagamento,
      destino: rowB.data_pagamento,
      diferenca_dias: dDat,
      dentro_tolerancia: false,
    }
    return {
      status: "DIVERGENCIA_DATA",
      regra: "REGRA_E_DIVERGENCIA_DATA",
      divergencias,
    }
  }

  // Caso tenha key match mas nao bate valor nem data: ja coberto por D ou E
  // Caso documento match mas fora de tolerancia de valor: ja coberto
  // Se chegou aqui, o candidato existe mas nao atende a nenhuma regra deterministica
  return null
}

// ========================================
// CLASSIFICACAO SEM PAR
// ========================================

function classificarRegistroSemPar(
  row: ImportRow,
  loteExecucao: string
): ConciliacaoResult {
  if (!temCamposMinimos(row)) {
    return {
      id_importacao_a: row.id,
      id_importacao_b: null,
      status: "DADOS_INSUFICIENTES",
      regra_aplicada: "REGRA_H_DADOS_INSUFICIENTES",
      campos_comparados: { matricula: row.matricula, cpf: row.cpf, documento: row.documento },
      divergencias: {},
      valor_origem: row.valor,
      valor_destino: null,
      diferenca_valor: null,
      data_origem: row.data_pagamento,
      data_destino: null,
      idempotencia_key: idempotenciaKey(row.id, null, "DADOS_INSUFICIENTES"),
      motivo: "Registro sem matricula, CPF ou documento para identificacao",
    }
  }

  return {
    id_importacao_a: row.id,
    id_importacao_b: null,
    status: "PENDENTE_SEM_CORRESPONDENCIA",
    regra_aplicada: "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA",
    campos_comparados: {},
    divergencias: {},
    valor_origem: row.valor,
    valor_destino: null,
    diferenca_valor: null,
    data_origem: row.data_pagamento,
    data_destino: null,
    idempotencia_key: idempotenciaKey(row.id, null, "PENDENTE_SEM_CORRESPONDENCIA"),
    motivo: "Nenhum registro de outra origem disponivel para comparacao",
  }
}

// ========================================
// PERSISTENCIA
// ========================================

async function salvarResultados(
  admin: ReturnType<typeof createAdminClient>,
  resultados: ConciliacaoResult[],
  sumario: SumarioConciliacao
): Promise<void> {
  const rows = resultados.map((r) => ({
    id_importacao_a: r.id_importacao_a,
    id_importacao_b: r.id_importacao_b,
    status: r.status,
    regra_aplicada: r.regra_aplicada,
    campos_comparados: r.campos_comparados,
    divergencias: r.divergencias,
    valor_origem: r.valor_origem,
    valor_destino: r.valor_destino,
    diferenca_valor: r.diferenca_valor,
    data_origem: r.data_origem,
    data_destino: r.data_destino,
    idempotencia_key: r.idempotencia_key,
    lote_execucao: sumario.lote_execucao,
    motivo: r.motivo,
  }))

  // Inserir em lotes de 100
  const BATCH_SIZE = 100
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    const { error } = await admin.from("conciliacoes").upsert(batch as any, {
      onConflict: "idempotencia_key",
      ignoreDuplicates: true,
    })

    if (error) {
      sumario.erros.push(`Erro ao salvar lote ${i}: ${error.message}`)
    }
  }

  // Atualizar sumario
  for (const r of resultados) {
    sumario.total_processados++
    switch (r.status) {
      case "CONCILIADO_EXATO":
        sumario.conciliados_exatos++
        break
      case "CONCILIADO_DOCUMENTO":
        sumario.conciliados_documento++
        break
      case "PENDENTE_SEM_CORRESPONDENCIA":
        sumario.pendentes_sem_correspondencia++
        break
      case "DIVERGENCIA_VALOR":
        sumario.divergencia_valor++
        break
      case "DIVERGENCIA_DATA":
        sumario.divergencia_data++
        break
      case "DIVERGENCIA_VALOR_DATA":
        sumario.divergencia_valor_data++
        break
      case "AMBIGUO_MULTIPLOS_CANDIDATOS":
        sumario.ambiguos++
        break
      case "DUPLICADO":
        sumario.duplicados++
        break
      case "DADOS_INSUFICIENTES":
        sumario.dados_insuficientes++
        break
    }
  }
}
