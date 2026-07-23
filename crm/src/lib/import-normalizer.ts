export type NormalizedRow = {
  origem: string
  arquivo_nome: string
  linha_original: string | null
  matricula: string | null
  nome: string | null
  cpf: string | null
  valor: number | null
  data_pagamento: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  documento: string | null
  observacao: string | null
  imported_at: string
}

export type ValidationError = {
  linha: number
  campo: string
  valor: string
  motivo: string
}

export type NormalizationResult = {
  rows: NormalizedRow[]
  errors: ValidationError[]
}

export function normalize(rows: any[], origem: string, arquivo_nome: string): NormalizationResult {
  const result: NormalizationResult = { rows: [], errors: [] }
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const normalized = normalizeRow(raw, origem, arquivo_nome, i, result.errors)
    if (normalized) result.rows.push(normalized)
  }
  return result
}

function normalizeRow(raw: any, origem: string, arquivo_nome: string, index: number, errors: ValidationError[]): NormalizedRow | null {
  const linha_original = raw.linha_original || JSON.stringify(raw)

  const matricula = normalizeTexto(raw.matricula)?.toUpperCase() || null
  const nome = normalizeNome(raw.nome)
  const cpf = normalizeCpf(raw.cpf, index, errors)
  const valor = normalizeValor(raw.valor, index, errors)
  const data_pagamento = normalizeData(raw.data_pagamento, index, errors)
  const banco = normalizeTexto(raw.banco) || null
  const agencia = normalizeTexto(raw.agencia) || null
  const conta = normalizeTexto(raw.conta) || null
  const documento = normalizeTexto(raw.documento) || null

  return {
    origem,
    arquivo_nome,
    linha_original,
    matricula,
    nome,
    cpf,
    valor,
    data_pagamento,
    banco,
    agencia,
    conta,
    documento,
    observacao: null,
    imported_at: new Date().toISOString(),
  }
}

function normalizeTexto(val: any): string | null {
  if (val === null || val === undefined || val === '') return null
  return String(val).trim().replace(/\s+/g, ' ').replace(/[\x00-\x1F]/g, '') || null
}

function normalizeNome(val: any): string | null {
  const t = normalizeTexto(val)
  if (!t) return null
  return t.replace(/\s+/g, ' ')
}

function normalizeCpf(val: any, index: number, errors: ValidationError[]): string | null {
  const t = normalizeTexto(val)
  if (!t) return null
  const digits = t.replace(/[^\d]/g, '')
  if (digits.length !== 11) {
    errors.push({ linha: index + 1, campo: 'cpf', valor: t, motivo: `CPF inválido: ${digits.length} dígitos (esperado 11)` })
    return null
  }
  return digits
}

function normalizeValor(val: any, index: number, errors: ValidationError[]): number | null {
  if (val === null || val === undefined || val === '') return null

  if (typeof val === 'number' && !isNaN(val)) return Math.round(val * 100) / 100

  let str = String(val).trim()
  str = str.replace(/[R$\s]/g, '')
  const hasPonto = str.includes('.')
  const hasVirgula = str.includes(',')

  if (hasPonto && hasVirgula) {
    const ultimoPonto = str.lastIndexOf('.')
    const ultimaVirgula = str.lastIndexOf(',')
    if (ultimoPonto > ultimaVirgula) {
      str = str.replace(/,/g, '')
    } else {
      str = str.replace(/\./g, '').replace(',', '.')
    }
  } else if (hasVirgula && !hasPonto) {
    str = str.replace(',', '.')
  }

  const num = parseFloat(str)
  if (isNaN(num)) {
    errors.push({ linha: index + 1, campo: 'valor', valor: String(val), motivo: 'Valor numérico inválido' })
    return null
  }
  return Math.round(num * 100) / 100
}

function normalizeData(val: any, index: number, errors: ValidationError[]): string | null {
  if (val === null || val === undefined || val === '') return null

  let d = String(val).trim()
  if (d.includes('T')) d = d.split('T')[0]

  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [dia, mes, ano] = d.split('/')
    return `${ano}-${mes}-${dia}`
  }
  if (/^\d{8}$/.test(d)) {
    return `${d.substring(4, 8)}-${d.substring(2, 4)}-${d.substring(0, 2)}`
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) {
    const [dia, mes, ano] = d.split('.')
    return `${ano}-${mes}-${dia}`
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(d)) {
    const parts = d.split('/')
    let ano = parts[2]
    if (ano.length === 2) ano = '20' + ano
    return `${ano}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
  }
  if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(d)) {
    const parts = d.split('-')
    let ano = parts[2]
    if (ano.length === 2) ano = '20' + ano
    return `${ano}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`
  }

  // Excel serial date number (days since 1899-12-30)
  const num = Number(val)
  if (!isNaN(num) && num > 40000 && num < 200000) {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + num * 86400000)
    return date.toISOString().split('T')[0]
  }

  errors.push({ linha: index + 1, campo: 'data_pagamento', valor: String(val), motivo: 'Formato de data não reconhecido' })
  return null
}
