import * as XLSX from 'xlsx'

export type ImportRow = {
  origem: string
  matricula?: any
  nome?: any
  cpf?: any
  valor?: any
  data_pagamento?: any
  banco?: any
  agencia?: any
  conta?: any
  documento?: any
  linha_original?: string | null
  arquivo_nome?: string | null
}

export type ImportResult = {
  rows: ImportRow[]
  errors: string[]
  total: number
  imported: number
}

const FIELD_MAP: Record<string, string[]> = {
  matricula: ['matricula', 'matrícula', 'matr', 'id', 'codigo', 'código', 'code'],
  nome: ['nome', 'name', 'pagador', 'cliente', 'favorecido', 'beneficiario', 'beneficiário'],
  cpf: ['cpf', 'cpf_cnpj', 'documento', 'doc', 'cnpj', 'identificacao', 'identificação'],
  valor: ['valor', 'value', 'amount', 'total', 'valordaparcela', 'vlr', 'preco', 'preço', 'saldo'],
  data_pagamento: ['data_pagamento', 'data', 'date', 'datadopagamento', 'vencimento', 'pagamento', 'dtpagamento', 'dt_pagamento'],
  banco: ['banco', 'bank', 'codigo_banco', 'codbanco', 'cod_banco'],
  agencia: ['agencia', 'agência', 'agency', 'ag'],
  conta: ['conta', 'account', 'cc', 'numeroconta', 'num_conta'],
  documento: ['documento', 'doc', 'numero_documento', 'nrdocumento', 'nota', 'nf', 'comprovante'],
}

function normalizeHeader(header: string): string {
  const h = header.toLowerCase().trim().replace(/[_\s]+/g, '_').replace(/[^a-z0-9_]/g, '')
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    if (aliases.includes(h)) return field
  }
  return h
}

export function parseCSV(buffer: Buffer, filename: string): ImportResult {
  const result: ImportResult = { rows: [], errors: [], total: 0, imported: 0 }
  try {
    const wb = XLSX.read(buffer, { type: 'buffer', raw: true, cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json<any>(ws, { defval: null, raw: true })
    result.total = json.length
    for (const row of json) {
      const mapped = mapRow(row, filename)
      if (mapped) { mapped.arquivo_nome = filename; result.rows.push(mapped) }
    }
    result.imported = result.rows.length
  } catch (e: any) {
    result.errors.push(`Erro ao ler CSV: ${e.message}`)
  }
  return result
}

export function parseXLSX(buffer: Buffer, filename: string): ImportResult {
  const result: ImportResult = { rows: [], errors: [], total: 0, imported: 0 }
  try {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json<any>(ws, { defval: null, raw: true })
    result.total = json.length
    for (const row of json) {
      const mapped = mapRow(row, filename)
      if (mapped) { mapped.arquivo_nome = filename; result.rows.push(mapped) }
    }
    result.imported = result.rows.length
  } catch (e: any) {
    result.errors.push(`Erro ao ler arquivo: ${e.message}`)
  }
  return result
}

export function parseCTN(buffer: Buffer, filename: string): ImportResult {
  const result: ImportResult = { rows: [], errors: [], total: 0, imported: 0 }
  try {
    const text = buffer.toString('utf-8')
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
    result.total = lines.length
    for (const line of lines) {
      const row = parseCTNLine(line, filename)
      if (row) { row.arquivo_nome = filename; result.rows.push(row) }
    }
    result.imported = result.rows.length
  } catch (e: any) {
    result.errors.push(`Erro ao ler CTN: ${e.message}`)
  }
  return result
}

function parseCTNLine(line: string, filename: string): ImportRow | null {
  const tipo = line.charAt(0)
  if (tipo !== '1') return null

  const row: ImportRow = {
    origem: 'ctn',
    linha_original: line,
    arquivo_nome: filename,
  }

  const matricula = line.substring(1, 21).trim()
  if (matricula) row.matricula = matricula

  const nome = line.substring(21, 51).trim()
  if (nome) row.nome = nome

  const cpf = line.substring(51, 65).trim()
  if (cpf) row.cpf = cpf.replace(/[^\d]/g, '')

  const valorStr = line.substring(65, 82).trim()
  if (valorStr) {
    const num = parseFloat(valorStr.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(num)) row.valor = num
  }

  const dataStr = line.substring(82, 90).trim()
  if (dataStr && dataStr.length === 8) {
    const dia = dataStr.substring(0, 2)
    const mes = dataStr.substring(2, 4)
    const ano = dataStr.substring(4, 8)
    row.data_pagamento = `${ano}-${mes}-${dia}`
  }

  const banco = line.substring(90, 93).trim()
  if (banco) row.banco = banco

  const agencia = line.substring(93, 103).trim()
  if (agencia) row.agencia = agencia

  const conta = line.substring(103, 120).trim()
  if (conta) row.conta = conta

  const documento = line.substring(120, 140).trim()
  if (documento) row.documento = documento

  return row
}

function mapRow(input: any, filename: string): ImportRow | null {
  const headers = Object.keys(input).filter(k => k !== '__rowNum__')
  if (headers.length === 0) return null

  const mapped: Record<string, any> = {}
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    for (const alias of aliases) {
      const key = headers.find(h => normalizeHeader(h) === alias)
      if (key !== undefined && input[key] !== null && input[key] !== undefined && input[key] !== '') {
        mapped[field] = input[key]
        break
      }
    }
  }

  const origem = filename.toLowerCase().endsWith('.csv') ? 'csv' : 'planilha'

  return {
    origem,
    matricula: mapped.matricula ?? null,
    nome: mapped.nome ?? null,
    cpf: mapped.cpf ?? null,
    valor: mapped.valor ?? null,
    data_pagamento: mapped.data_pagamento ?? null,
    banco: mapped.banco ?? null,
    agencia: mapped.agencia ?? null,
    conta: mapped.conta ?? null,
    documento: mapped.documento ?? null,
    linha_original: JSON.stringify(input),
  }
}
