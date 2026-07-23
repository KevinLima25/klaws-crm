import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseCSV, parseXLSX, parseCTN } from "@/lib/import-parser"
import { normalize } from "@/lib/import-normalizer"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name.toLowerCase()

    let parsed
    if (filename.endsWith(".csv")) {
      parsed = parseCSV(buffer, file.name)
    } else if (filename.endsWith(".xls") || filename.endsWith(".xlsx")) {
      parsed = parseXLSX(buffer, file.name)
    } else if (filename.endsWith(".ctn")) {
      parsed = parseCTN(buffer, file.name)
    } else {
      return NextResponse.json({ error: "Formato não suportado. Use CSV, XLS, XLSX ou CTN." }, { status: 400 })
    }

    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: "Nenhuma linha encontrada no arquivo", errors: parsed.errors }, { status: 400 })
    }

    const origem = filename.endsWith('.csv') ? 'csv' : filename.endsWith('.ctn') ? 'ctn' : 'planilha'
    const normalized = normalize(parsed.rows, origem, file.name)

    if (normalized.rows.length === 0) {
      return NextResponse.json({ error: "Nenhum registro válido após normalização", errors: parsed.errors, validationErrors: normalized.errors }, { status: 400 })
    }

    const admin = createAdminClient()

    // Strip null fields to avoid schema cache issues
    const cleanRows = normalized.rows.map((r: any) => {
      const clean: any = {}
      for (const [k, v] of Object.entries(r)) {
        if (v !== null && v !== undefined) clean[k] = v
      }
      return clean
    })

    const { data, error } = await admin.from("importacoes").insert(cleanRows as any).select()

    if (error) {
      return NextResponse.json({ error: error.message, details: parsed.errors }, { status: 500 })
    }

    return NextResponse.json({
      status: "ok",
      total: parsed.total,
      imported: normalized.rows.length,
      invalid: normalized.errors.length,
      parserErrors: parsed.errors,
      validationErrors: normalized.errors,
      rows: data?.length || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}
