import { createHash } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

// ========================================
// TOLERANCIAS (aprovadas pelo usuario)
// ========================================
const TOLERANCIA_MONETARIA = 0.00 // valor exato obrigatorio
const TOLERANCIA_DATA_DIAS = 1 // ± 1 dia para compatibilidade
const TIMEZONE = "America/Sao_Paulo"
const MOTOR_VERSION = "2.3.0"

// ========================================
// CAMPOS MINIMOS PARA CONCILIACAO
// ========================================
const CAMPOS_IDENTIFICACAO = ["matricula", "cpf", "documento"] as const

// ========================================
// PRIORIDADE DE IDENTIFICADORES
// ========================================
// Documento > Hash Comprovante > Matricula > CPF > Valor + Data > Nome

// ========================================
// TIPOS
// ========================================

export type StatusConciliacao =
  | "CONCILIADO_EXATO"
  | "CONCILIADO_DOCUMENTO"
  | "AGUARDANDO_DOCUMENTO"
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

export type ComprovanteRow = {
  id: string
  nome_pagador: string | null
  valor: number | null
  data_hora: string | null
  matriculas: string[]
  arquivo_drive_id: string | null
  status: string
}

export type CandidateMatch = {
  record?: ImportRow
  comprovante?: ComprovanteRow
  keyField: string
  keyValue: string
  tipo: "import" | "comprovante"
}

export type ConciliacaoResult = {
  id_importacao_a: string | null
  id_importacao_b: string | null
  id_comprovante: string | null
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
  motor_version: string
  lote_importacao: string | null
  lote_conciliacao: string | null
  lote_ocr: string | null
  lote_whatsapp: string | null
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
  aguardando_documento: number
  pendentes_sem_correspondencia: number
  divergencia_valor: number
  divergencia_data: number
  divergencia_valor_data: number
  ambiguos: number
  duplicados: number
  dados_insuficientes: number
  pendentes_conferencia: number
  erros: string[]
  executado_em: string
  motor_version: string
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

function normalizarNome(v: string | null): string | null {
  if (!v) return null
  return v.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "") || null
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

function dataFromTimestamp(ts: string | null): string | null {
  if (!ts) return null
  return ts.split("T")[0] || null
}

function gerarHashDeterministico(...parts: (string | null)[]): string {
  return createHash("sha256")
    .update(parts.filter(Boolean).join("|"))
    .digest("hex")
    .substring(0, 32)
}

function temCamposMinimos(row: ImportRow): boolean {
  return CAMPOS_IDENTIFICACAO.some((campo) => {
    const val = row[campo]
    return val !== null && val !== undefined && String(val).trim() !== ""
  })
}

// ========================================
// LOG DE AUDITORIA
// ========================================

type LogEntry = {
  lote_execucao: string
  conciliacao_id?: string
  acao: string
  detalhes: Record<string, any>
  motor_version: string
}

let logsPendentes: LogEntry[] = []

function log(lote: string, acao: string, detalhes: Record<string, any>, conciliacaoId?: string) {
  logsPendentes.push({
    lote_execucao: lote,
    conciliacao_id: conciliacaoId,
    acao,
    detalhes,
    motor_version: MOTOR_VERSION,
  })
}

async function flushLogs(admin: ReturnType<typeof createAdminClient>) {
  if (logsPendentes.length === 0) return
  const batch = [...logsPendentes]
  logsPendentes = []
  for (let i = 0; i < batch.length; i += 100) {
    const slice = batch.slice(i, i + 100)
    await admin.from("conciliacao_logs").insert(slice as any)
  }
}

// ========================================
// MOTOR PRINCIPAL
// ========================================

export async function executarConciliacao(
  filtros?: FiltrosConciliacao
): Promise<SumarioConciliacao> {
  const admin = createAdminClient()
  logsPendentes = []
  const loteExecucao = crypto.randomUUID()
  const erros: string[] = []

  const sumario: SumarioConciliacao = {
    lote_execucao: loteExecucao,
    total_processados: 0,
    conciliados_exatos: 0,
    conciliados_documento: 0,
    aguardando_documento: 0,
    pendentes_sem_correspondencia: 0,
    divergencia_valor: 0,
    divergencia_data: 0,
    divergencia_valor_data: 0,
    ambiguos: 0,
    duplicados: 0,
    dados_insuficientes: 0,
    pendentes_conferencia: 0,
    erros: [],
    executado_em: new Date().toISOString(),
    motor_version: MOTOR_VERSION,
  }

  log(loteExecucao, "INICIO_EXECUCAO", { filtros: filtros || {} })

  try {
    // 1. Carregar registros ja processados
    const { data: processados, error: errProc } = await admin
      .from("conciliacoes")
      .select("id_importacao_a, id_importacao_b, id_comprovante")
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
      await flushLogs(admin)
      return sumario
    }

    const idsImportUsados = new Set<string>()
    const idsCompUsados = new Set<string>()
    for (const c of processados || []) {
      if (c.id_importacao_a) idsImportUsados.add(c.id_importacao_a)
      if (c.id_importacao_b) idsImportUsados.add(c.id_importacao_b)
      if (c.id_comprovante) idsCompUsados.add(c.id_comprovante)
    }

    // 2. Carregar importacoes nao processadas
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
      await flushLogs(admin)
      return sumario
    }

    // 3. Carregar comprovantes nao processados
    const { data: comprovantesRaw } = await admin
      .from("comprovantes")
      .select("*")

    const comprovantes: ComprovanteRow[] = (comprovantesRaw || [])
      .filter((c: any) => !idsCompUsados.has(c.id))
      .map((c: any) => ({
        id: c.id,
        nome_pagador: c.nome_pagador || null,
        valor: c.valor ?? null,
        data_hora: c.data_hora || null,
        matriculas: Array.isArray(c.matriculas) ? c.matriculas : [],
        arquivo_drive_id: c.arquivo_drive_id || null,
        status: c.status || "pendente",
      }))

    log(loteExecucao, "DADOS_CARREGADOS", {
      importacoes_total: importacoes?.length || 0,
      importacoes_pendentes: (importacoes || []).filter((r) => !idsImportUsados.has(r.id)).length,
      comprovantes_total: comprovantes.length,
      ids_import_usados: idsImportUsados.size,
      ids_comp_usados: idsCompUsados.size,
    })

    if (!importacoes || importacoes.length === 0) {
      sumario.erros = erros
      log(loteExecucao, "FIM_EXECUCAO", { motivo: "sem_importacoes" })
      await flushLogs(admin)
      return sumario
    }

    // Filtrar registros ja processados
    const pendentes = (importacoes as ImportRow[]).filter((r) => !idsImportUsados.has(r.id))
    if (pendentes.length === 0) {
      log(loteExecucao, "FIM_EXECUCAO", { motivo: "todos_ja_processados" })
      await flushLogs(admin)
      return sumario
    }

    // 4. Agrupar por origem
    const grupos = new Map<string, ImportRow[]>()
    for (const row of pendentes) {
      const grupo = grupos.get(row.origem) || []
      grupo.push(row)
      grupos.set(row.origem, grupo)
    }

    const origensUnicas = Array.from(grupos.keys())

    // 5. Construir indices (importacoes + comprovantes)
    type IndicesImport = {
      porDocumento: Map<string, ImportRow[]>
      porMatricula: Map<string, ImportRow[]>
      porCpf: Map<string, ImportRow[]>
      porValorData: Map<string, ImportRow[]>
      porNome: Map<string, ImportRow[]>
    }

    type IndicesComprovante = {
      porHash: Map<string, ComprovanteRow[]>
      porMatricula: Map<string, ComprovanteRow[]>
      porValorData: Map<string, ComprovanteRow[]>
      porNome: Map<string, ComprovanteRow[]>
    }

    const indicesImportPorOrigem = new Map<string, IndicesImport>()
    for (const [origem, rows] of grupos) {
      const indices: IndicesImport = {
        porDocumento: new Map(),
        porMatricula: new Map(),
        porCpf: new Map(),
        porValorData: new Map(),
        porNome: new Map(),
      }
      for (const row of rows) {
        const doc = normalizarDocumento(row.documento)
        if (doc) addToMap(indices.porDocumento, doc, row)

        const mat = normalizarMatricula(row.matricula)
        if (mat) addToMap(indices.porMatricula, mat, row)

        if (row.cpf) addToMap(indices.porCpf, row.cpf, row)

        if (row.valor != null && row.data_pagamento) {
          const vdKey = `${row.valor}|${row.data_pagamento}`
          addToMap(indices.porValorData, vdKey, row)
        }

        const nome = normalizarNome(row.nome)
        if (nome) addToMap(indices.porNome, nome, row)
      }
      indicesImportPorOrigem.set(origem, indices)
    }

    const indicesComp: IndicesComprovante = {
      porHash: new Map(),
      porMatricula: new Map(),
      porValorData: new Map(),
      porNome: new Map(),
    }
    for (const comp of comprovantes) {
      if (comp.arquivo_drive_id) {
        addToMapComprovante(indicesComp.porHash, comp.arquivo_drive_id, comp)
      }
      for (const mat of comp.matriculas) {
        const m = normalizarMatricula(mat)
        if (m) addToMapComprovante(indicesComp.porMatricula, m, comp)
      }
      if (comp.valor != null) {
        const dataComp = dataFromTimestamp(comp.data_hora)
        if (dataComp) {
          const vdKey = `${comp.valor}|${dataComp}`
          addToMapComprovante(indicesComp.porValorData, vdKey, comp)
        }
      }
      const nome = normalizarNome(comp.nome_pagador)
      if (nome) addToMapComprovante(indicesComp.porNome, nome, comp)
    }

    // 6. Conciliacao por fases
    const resultados: ConciliacaoResult[] = []
    const jaPareadosImport = new Set<string>()
    const jaPareadosComp = new Set<string>()

    // Para cada origem A, comparar com cada origem B (A != B)
    for (let i = 0; i < origensUnicas.length; i++) {
      for (let j = i + 1; j < origensUnicas.length; j++) {
        const origemA = origensUnicas[i]
        const origemB = origensUnicas[j]
        const grupoA = grupos.get(origemA)!
        const grupoB = grupos.get(origemB)!
        const indicesB = indicesImportPorOrigem.get(origemB)!

        // FASE 1: Documento
        resultados.push(
          ...conciliarFase(grupoA, indicesB, indicesComp, jaPareadosImport, jaPareadosComp, "documento", loteExecucao)
        )

        // FASE 2: Comprovante hash (import documento vs comprovante arquivo_drive_id)
        resultados.push(
          ...conciliarFaseComprovanteHash(grupoA, indicesComp, jaPareadosImport, jaPareadosComp, loteExecucao)
        )

        // FASE 3: Matricula
        resultados.push(
          ...conciliarFase(grupoA, indicesB, indicesComp, jaPareadosImport, jaPareadosComp, "matricula", loteExecucao)
        )

        // FASE 4: CPF
        resultados.push(
          ...conciliarFase(grupoA, indicesB, indicesComp, jaPareadosImport, jaPareadosComp, "cpf", loteExecucao)
        )

        // FASE 5: Valor + Data
        resultados.push(
          ...conciliarFase(grupoA, indicesB, indicesComp, jaPareadosImport, jaPareadosComp, "valorData", loteExecucao)
        )

        // FASE 6: Nome (sugestao)
        resultados.push(
          ...conciliarFase(grupoA, indicesB, indicesComp, jaPareadosImport, jaPareadosComp, "nome", loteExecucao)
        )
      }
    }

    // 7. Registros sem par
    for (const row of pendentes) {
      if (!jaPareadosImport.has(row.id)) {
        const result = classificarRegistroSemPar(row, loteExecucao)
        resultados.push(result)
        log(loteExecucao, "CLASSIFICADO_SEM_PAR", {
          importacao_id: row.id,
          status: result.status,
          motivo: result.motivo,
        })
      }
    }

    // 8. Comprovantes sem par
    for (const comp of comprovantes) {
      if (!jaPareadosComp.has(comp.id)) {
        const key = gerarHashDeterministico(comp.id, "PENDENTE_SEM_CORRESPONDENCIA")
        resultados.push({
          id_importacao_a: null,
          id_importacao_b: null,
          id_comprovante: comp.id,
          status: "PENDENTE_SEM_CORRESPONDENCIA",
          regra_aplicada: "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA",
          campos_comparados: { comprovante_id: comp.id, nome_pagador: comp.nome_pagador },
          divergencias: {},
          valor_origem: comp.valor,
          valor_destino: null,
          diferenca_valor: null,
          data_origem: dataFromTimestamp(comp.data_hora),
          data_destino: null,
          idempotencia_key: key,
          motivo: "Comprovante sem correspondencia em nenhuma importacao",
          motor_version: MOTOR_VERSION,
          lote_importacao: null,
          lote_conciliacao: loteExecucao,
          lote_ocr: null,
          lote_whatsapp: null,
        })
        log(loteExecucao, "COMPROVANTE_SEM_PAR", { comprovante_id: comp.id })
      }
    }

    // 9. Salvar
    await salvarResultados(admin, resultados, sumario, loteExecucao)
    sumario.erros = erros
    await flushLogs(admin)
    return sumario
  } catch (e: any) {
    erros.push(`Erro inesperado: ${e.message || String(e)}`)
    sumario.erros = erros
    log(loteExecucao, "ERRO_INESPERADO", { erro: e.message || String(e) })
    await flushLogs(admin)
    return sumario
  }
}

// ========================================
// CONCILIACAO POR FASE
// ========================================

function conciliarFase(
  grupoA: ImportRow[],
  indicesB: {
    porDocumento: Map<string, ImportRow[]>
    porMatricula: Map<string, ImportRow[]>
    porCpf: Map<string, ImportRow[]>
    porValorData: Map<string, ImportRow[]>
    porNome: Map<string, ImportRow[]>
  },
  indicesComp: {
    porHash: Map<string, ComprovanteRow[]>
    porMatricula: Map<string, ComprovanteRow[]>
    porValorData: Map<string, ComprovanteRow[]>
    porNome: Map<string, ComprovanteRow[]>
  },
  jaPareadosImport: Set<string>,
  jaPareadosComp: Set<string>,
  fase: "documento" | "matricula" | "cpf" | "valorData" | "nome",
  loteExecucao: string
): ConciliacaoResult[] {
  const resultados: ConciliacaoResult[] = []

  for (const rowA of grupoA) {
    if (jaPareadosImport.has(rowA.id)) continue
    if (fase !== "documento" && fase !== "valorData" && !temCamposMinimos(rowA)) continue

    // Buscar candidatos por fase no grupo B
    const candidatosImport: ImportRow[] = []
    const mapRef =
      fase === "documento" ? indicesB.porDocumento :
      fase === "matricula" ? indicesB.porMatricula :
      fase === "cpf" ? indicesB.porCpf :
      fase === "valorData" ? indicesB.porValorData :
      indicesB.porNome

    if (fase === "valorData") {
      if (rowA.valor != null && rowA.data_pagamento) {
        const key = `${rowA.valor}|${rowA.data_pagamento}`
        const found = mapRef.get(key)
        if (found) candidatosImport.push(...found)
      }
    } else {
      const key =
        fase === "documento" ? normalizarDocumento(rowA.documento) :
        fase === "matricula" ? normalizarMatricula(rowA.matricula) :
        fase === "cpf" ? rowA.cpf :
        normalizarNome(rowA.nome)
      if (key) {
        const found = mapRef.get(key)
        if (found) candidatosImport.push(...found)
      }
    }

    // Buscar candidatos comprovante pela mesma chave
    const candidatosComp: ComprovanteRow[] = []
    if (fase === "documento") {
      // Tenta cruzar documento com arquivo_drive_id do comprovante
      const doc = normalizarDocumento(rowA.documento)
      if (doc) {
        const found = indicesComp.porHash.get(doc)
        if (found) candidatosComp.push(...found)
      }
    }
    if (fase === "matricula") {
      const mat = normalizarMatricula(rowA.matricula)
      if (mat) {
        const found = indicesComp.porMatricula.get(mat)
        if (found) candidatosComp.push(...found)
      }
    }
    if (fase === "valorData") {
      if (rowA.valor != null && rowA.data_pagamento) {
        const key = `${rowA.valor}|${rowA.data_pagamento}`
        const found = indicesComp.porValorData.get(key)
        if (found) candidatosComp.push(...found)
      }
    }
    if (fase === "nome") {
      const nome = normalizarNome(rowA.nome)
      if (nome) {
        const found = indicesComp.porNome.get(nome)
        if (found) candidatosComp.push(...found)
      }
    }

    // Filtrar ja pareados
    const importDisp = candidatosImport.filter((r) => !jaPareadosImport.has(r.id))
    const compDisp = candidatosComp.filter((c) => !jaPareadosComp.has(c.id))

    const totalCandidatos = importDisp.length + compDisp.length

    if (totalCandidatos === 0) continue

    // Montar candidates
    const allCandidates: { tipo: "import"; record: ImportRow }[] = [
      ...importDisp.map((r) => ({ tipo: "import" as const, record: r })),
    ]
    // Mount candidates from comprovantes (treated as "import" side in result but stored as comprovante)
    const allCompCandidates: { tipo: "comprovante"; record: ComprovanteRow }[] = [
      ...compDisp.map((c) => ({ tipo: "comprovante" as const, record: c })),
    ]

    // Avaliar rules
    if (fase === "nome") {
      // Fase nome: apenas sugestao para conferencia humana
      if (allCandidates.length === 1) {
        const cand = allCandidates[0].record
        resultados.push(criarResultado(rowA.id, cand.id, null, "PENDENTE_CONFERENCIA", "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA", loteExecucao, {
          nome_a: rowA.nome,
          nome_b: cand.nome,
          fase: "nome",
        }, {}, rowA.valor, cand.valor, rowA.data_pagamento, cand.data_pagamento,
          `Sugestao por nome: "${rowA.nome}" ~ "${cand.nome}" - requer conferencia humana`))
        jaPareadosImport.add(rowA.id)
        jaPareadosImport.add(cand.id)
        log(loteExecucao, "SUGESTAO_NOME", { import_a: rowA.id, import_b: cand.id, nome_a: rowA.nome, nome_b: cand.nome })
      } else if (allCandidates.length > 1) {
        resultados.push(criarResultado(rowA.id, null, null, "AMBIGUO_MULTIPLOS_CANDIDATOS", "REGRA_F_AMBIGUO_MULTIPLOS", loteExecucao,
          { fase: "nome", candidatos: allCandidates.map((c) => c.record.id) }, {},
          rowA.valor, null, rowA.data_pagamento, null,
          `${allCandidates.length} candidatos por nome - ambiguo`))
        jaPareadosImport.add(rowA.id)
      }
      continue
    }

    // Para fases determinísticas (documento, matricula, cpf, valorData)
    const totalMatches = allCandidates.length + allCompCandidates.length
    
    if (totalMatches === 1) {
      if (allCandidates.length === 1) {
        const cand = allCandidates[0].record
        const { status, regra, divs } = determinarRegra(rowA, cand, null, fase)
        if (status) {
          const key = gerarHashDeterministico(
            rowA.id < cand.id ? rowA.id : cand.id,
            rowA.id < cand.id ? cand.id : rowA.id,
            status
          )
          resultados.push(criarResultado(rowA.id, cand.id, null, status, regra, loteExecucao,
            montarCamposComparados(rowA, cand, null, fase), divs,
            rowA.valor, cand.valor, rowA.data_pagamento, cand.data_pagamento))
          jaPareadosImport.add(rowA.id)
          jaPareadosImport.add(cand.id)
          log(loteExecucao, `MATCH_${fase.toUpperCase()}`, { import_a: rowA.id, import_b: cand.id, status, regra })
        }
      } else if (allCompCandidates.length === 1) {
        const comp = allCompCandidates[0].record
        const { status, regra, divs } = determinarRegraComprovante(rowA, comp, fase)
        if (status) {
          const key = gerarHashDeterministico(rowA.id, comp.id, status)
          resultados.push(criarResultado(rowA.id, null, comp.id, status, regra, loteExecucao,
            montarCamposComparados(rowA, null, comp, fase), divs,
            rowA.valor, comp.valor, rowA.data_pagamento, dataFromTimestamp(comp.data_hora)))
          jaPareadosImport.add(rowA.id)
          jaPareadosComp.add(comp.id)
          log(loteExecucao, `MATCH_COMPROVANTE_${fase.toUpperCase()}`, { import_a: rowA.id, comprovante_id: comp.id, status, regra })
        }
      }
    } else if (totalMatches > 1) {
      // F) Ambiguo
      const allIds: string[] = [
        ...allCandidates.map((c) => c.record.id),
        ...allCompCandidates.map((c) => c.record.id),
      ]
      resultados.push(criarResultado(rowA.id, null, null, "AMBIGUO_MULTIPLOS_CANDIDATOS", "REGRA_F_AMBIGUO_MULTIPLOS", loteExecucao,
        { fase, candidatos: allIds }, {},
        rowA.valor, null, rowA.data_pagamento, null,
        `${totalMatches} candidatos atendem a ${fase}`))
      jaPareadosImport.add(rowA.id)
      log(loteExecucao, `AMBIGUO_${fase.toUpperCase()}`, { import_a: rowA.id, candidatos: allIds, fase })
    }
  }

  return resultados
}

function conciliarFaseComprovanteHash(
  grupoA: ImportRow[],
  indicesComp: {
    porHash: Map<string, ComprovanteRow[]>
    porMatricula: Map<string, ComprovanteRow[]>
    porValorData: Map<string, ComprovanteRow[]>
    porNome: Map<string, ComprovanteRow[]>
  },
  jaPareadosImport: Set<string>,
  jaPareadosComp: Set<string>,
  loteExecucao: string
): ConciliacaoResult[] {
  const resultados: ConciliacaoResult[] = []

  for (const rowA of grupoA) {
    if (jaPareadosImport.has(rowA.id)) continue

    const doc = normalizarDocumento(rowA.documento)
    if (!doc) continue

    const found = indicesComp.porHash.get(doc)
    if (!found) continue

    const disponiveis = found.filter((c) => !jaPareadosComp.has(c.id))

    if (disponiveis.length === 1) {
      const comp = disponiveis[0]
      const { status, regra, divs } = determinarRegraComprovante(rowA, comp, "documento")
      if (status) {
        const key = gerarHashDeterministico(rowA.id, comp.id, status)
        resultados.push(criarResultado(rowA.id, null, comp.id, status, regra, loteExecucao,
          montarCamposComparados(rowA, null, comp, "documento"), divs,
          rowA.valor, comp.valor, rowA.data_pagamento, dataFromTimestamp(comp.data_hora)))
        jaPareadosImport.add(rowA.id)
        jaPareadosComp.add(comp.id)
        log(loteExecucao, "MATCH_COMPROVANTE_HASH", { import_a: rowA.id, comprovante_id: comp.id, status, regra })
      }
    } else if (disponiveis.length > 1) {
      resultados.push(criarResultado(rowA.id, null, null, "AMBIGUO_MULTIPLOS_CANDIDATOS", "REGRA_F_AMBIGUO_MULTIPLOS", loteExecucao,
        { fase: "comprovante_hash", candidatos: disponiveis.map((c) => c.id) }, {},
        rowA.valor, null, rowA.data_pagamento, null,
        `${disponiveis.length} comprovantes com mesmo hash`))
      jaPareadosImport.add(rowA.id)
      log(loteExecucao, "AMBIGUO_COMPROVANTE_HASH", { import_a: rowA.id, comprovantes: disponiveis.map((c) => c.id) })
    }
  }

  return resultados
}

// ========================================
// DETERMINACAO DE REGRA
// ========================================

function determinarRegra(
  rowA: ImportRow,
  rowB: ImportRow,
  _comp: null,
  fase: string
): { status: StatusConciliacao | null; regra: RegraAplicada; divs: Record<string, any> } {
  const dVal = diffValor(rowA.valor, rowB.valor)
  const dDat = diffData(rowA.data_pagamento, rowB.data_pagamento)

  const valorExato = rowA.valor !== null && rowB.valor !== null && dVal === 0
  const valorCompativel = dVal !== null && dVal <= TOLERANCIA_MONETARIA
  const dataExata = rowA.data_pagamento !== null && rowB.data_pagamento !== null && dDat === 0
  const dataCompativel = dDat !== null && dDat <= TOLERANCIA_DATA_DIAS

  const divs: Record<string, any> = {}

  // A) Exato: mesma chave + valor exato + data compativel
  if (valorExato && dataCompativel) {
    return { status: "CONCILIADO_EXATO", regra: "REGRA_A_CONCILIADO_EXATO", divs: {} }
  }

  // B) Documento: fase=documento + valor exato
  if (fase === "documento" && valorExato) {
    return { status: "CONCILIADO_DOCUMENTO", regra: "REGRA_B_CONCILIADO_DOCUMENTO", divs: {} }
  }

  // D) Divergencia valor
  if (dVal !== null && !valorCompativel) {
    divs.valor = { origem: rowA.valor, destino: rowB.valor, diferenca: dVal, dentro_tolerancia: false }
    const status: StatusConciliacao = (dDat !== null && !dataCompativel) ? "DIVERGENCIA_VALOR_DATA" : "DIVERGENCIA_VALOR"
    if (dDat !== null && !dataCompativel) {
      divs.data = { origem: rowA.data_pagamento, destino: rowB.data_pagamento, diferenca_dias: dDat, dentro_tolerancia: false }
    }
    return { status, regra: "REGRA_D_DIVERGENCIA_VALOR", divs }
  }

  // E) Divergencia data (valor compativel, data nao)
  if (valorCompativel && dDat !== null && !dataCompativel) {
    divs.data = { origem: rowA.data_pagamento, destino: rowB.data_pagamento, diferenca_dias: dDat, dentro_tolerancia: false }
    return { status: "DIVERGENCIA_DATA", regra: "REGRA_E_DIVERGENCIA_DATA", divs }
  }

  return { status: null, regra: "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA", divs: {} }
}

function determinarRegraComprovante(
  rowA: ImportRow,
  comp: ComprovanteRow,
  fase: string
): { status: StatusConciliacao | null; regra: RegraAplicada; divs: Record<string, any> } {
  const compData = dataFromTimestamp(comp.data_hora)
  const dVal = diffValor(rowA.valor, comp.valor)
  const dDat = rowA.data_pagamento && compData ? diffData(rowA.data_pagamento, compData) : null

  const valorExato = rowA.valor !== null && comp.valor !== null && dVal === 0
  const dataCompativel = dDat !== null && dDat <= TOLERANCIA_DATA_DIAS

  const divs: Record<string, any> = {}

  // Comprovante: valor exato + data compativel = EXATO
  if (valorExato && dataCompativel) {
    return { status: "CONCILIADO_EXATO", regra: "REGRA_A_CONCILIADO_EXATO", divs: {} }
  }

  // Comprovante: mesmo hash/documento + valor exato = DOCUMENTO
  if (fase === "documento" && valorExato) {
    return { status: "CONCILIADO_DOCUMENTO", regra: "REGRA_B_CONCILIADO_DOCUMENTO", divs: {} }
  }

  // Valor diverge
  if (dVal !== null && dVal > TOLERANCIA_MONETARIA) {
    divs.valor = { origem: rowA.valor, destino: comp.valor, diferenca: dVal, dentro_tolerancia: false }
    return { status: "DIVERGENCIA_VALOR", regra: "REGRA_D_DIVERGENCIA_VALOR", divs }
  }

  // Data diverge
  if (dDat !== null && dDat > TOLERANCIA_DATA_DIAS) {
    divs.data = { origem: rowA.data_pagamento, destino: compData, diferenca_dias: dDat, dentro_tolerancia: false }
    return { status: "DIVERGENCIA_DATA", regra: "REGRA_E_DIVERGENCIA_DATA", divs }
  }

  return { status: null, regra: "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA", divs: {} }
}

// ========================================
// MONTAGEM DE RESULTADO
// ========================================

function criarResultado(
  idA: string | null,
  idB: string | null,
  idComp: string | null,
  status: StatusConciliacao,
  regra: RegraAplicada,
  loteExecucao: string,
  campos: Record<string, any>,
  divergencias: Record<string, any>,
  valorOrigem: number | null,
  valorDestino: number | null,
  dataOrigem: string | null,
  dataDestino: string | null,
  motivo?: string | null
): ConciliacaoResult {
  const loteConc = loteExecucao

  return {
    id_importacao_a: idA,
    id_importacao_b: idB,
    id_comprovante: idComp,
    status,
    regra_aplicada: regra,
    campos_comparados: campos,
    divergencias,
    valor_origem: valorOrigem,
    valor_destino: valorDestino,
    diferenca_valor: diffValor(valorOrigem, valorDestino),
    data_origem: dataOrigem,
    data_destino: dataDestino,
    idempotencia_key: gerarHashDeterministico(
      idA,
      idB,
      idComp,
      status
    ),
    motivo: motivo || null,
    motor_version: MOTOR_VERSION,
    lote_importacao: null,
    lote_conciliacao: loteConc,
    lote_ocr: null,
    lote_whatsapp: null,
  }
}

function montarCamposComparados(
  rowA: ImportRow,
  rowB: ImportRow | null,
  comp: ComprovanteRow | null,
  fase: string
): Record<string, any> {
  const campos: Record<string, any> = {
    fase,
    origem_a: rowA.origem,
    matricula_a: rowA.matricula,
    cpf_a: rowA.cpf,
    documento_a: rowA.documento,
    nome_a: rowA.nome,
  }
  if (rowB) {
    campos.origem_b = rowB.origem
    campos.matricula_b = rowB.matricula
    campos.cpf_b = rowB.cpf
    campos.documento_b = rowB.documento
    campos.nome_b = rowB.nome
  }
  if (comp) {
    campos.comprovante_id = comp.id
    campos.comprovante_nome = comp.nome_pagador
    campos.comprovante_hash = comp.arquivo_drive_id
    campos.comprovante_matriculas = comp.matriculas
  }
  return campos
}

// ========================================
// CLASSIFICACAO SEM PAR
// ========================================

function classificarRegistroSemPar(
  row: ImportRow,
  loteExecucao: string
): ConciliacaoResult {
  if (!temCamposMinimos(row)) {
    return criarResultado(
      row.id, null, null, "DADOS_INSUFICIENTES", "REGRA_H_DADOS_INSUFICIENTES", loteExecucao,
      { matricula: row.matricula, cpf: row.cpf, documento: row.documento }, {},
      row.valor, null, row.data_pagamento, null,
      "Registro sem matricula, CPF ou documento para identificacao"
    )
  }

  return criarResultado(
    row.id, null, null, "PENDENTE_SEM_CORRESPONDENCIA", "REGRA_C_PENDENTE_SEM_CORRESPONDENCIA", loteExecucao,
    {}, {},
    row.valor, null, row.data_pagamento, null,
    "Nenhum registro de outra origem disponivel para comparacao"
  )
}

// ========================================
// PERSISTENCIA
// ========================================

async function salvarResultados(
  admin: ReturnType<typeof createAdminClient>,
  resultados: ConciliacaoResult[],
  sumario: SumarioConciliacao,
  loteExecucao: string
): Promise<void> {
  const rows = resultados.map((r) => ({
    id_importacao_a: r.id_importacao_a,
    id_importacao_b: r.id_importacao_b,
    id_comprovante: r.id_comprovante,
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
    lote_execucao: loteExecucao,
    motivo: r.motivo,
    motor_version: r.motor_version,
    lote_importacao: r.lote_importacao,
    lote_conciliacao: r.lote_conciliacao,
    lote_ocr: r.lote_ocr,
    lote_whatsapp: r.lote_whatsapp,
  }))

  const BATCH_SIZE = 100
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    const { error } = await admin.from("conciliacoes").upsert(batch as any, {
      onConflict: "idempotencia_key",
      ignoreDuplicates: true,
    })

    if (error) {
      sumario.erros.push(`Erro ao salvar lote ${i}: ${error.message}`)
      log(loteExecucao, "ERRO_SALVAR", { batch: i, erro: error.message })
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
      case "AGUARDANDO_DOCUMENTO":
        sumario.aguardando_documento++
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
      case "PENDENTE_CONFERENCIA":
        sumario.pendentes_conferencia++
        break
    }
  }

  log(loteExecucao, "RESULTADOS_SALVOS", {
    total: sumario.total_processados,
    conciliados_exatos: sumario.conciliados_exatos,
    conciliados_documento: sumario.conciliados_documento,
    aguardando_documento: sumario.aguardando_documento,
    pendentes: sumario.pendentes_sem_correspondencia,
    divergencia_valor: sumario.divergencia_valor,
    divergencia_data: sumario.divergencia_data,
    ambiguos: sumario.ambiguos,
    dados_insuficientes: sumario.dados_insuficientes,
    pendentes_conferencia: sumario.pendentes_conferencia,
  })
}

// ========================================
// UTILITARIOS
// ========================================

function addToMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const arr = map.get(key) || []
  arr.push(value)
  map.set(key, arr)
}

function addToMapComprovante<K>(map: Map<K, ComprovanteRow[]>, key: K, value: ComprovanteRow) {
  const arr = map.get(key) || []
  arr.push(value)
  map.set(key, arr)
}
