import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseCSV, parseXLSX, parseCTN } from "@/lib/import-parser"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name.toLowerCase()

    let result
    if (filename.endsWith(".csv")) {
      result = parseCSV(buffer, file.name)
    } else if (filename.endsWith(".xls") || filename.endsWith(".xlsx")) {
      result = parseXLSX(buffer, file.name)
    } else if (filename.endsWith(".ctn")) {
      result = parseCTN(buffer, file.name)
    } else {
      return NextResponse.json({ error: "Formato não suportado. Use CSV, XLS, XLSX ou CTN." }, { status: 400 })
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Nenhuma linha encontrada no arquivo", errors: result.errors }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin.from("importacoes").insert(result.rows).select()

    if (error) {
      return NextResponse.json({ error: error.message, details: result.errors }, { status: 500 })
    }

    return NextResponse.json({
      status: "ok",
      total: result.total,
      imported: result.imported,
      errors: result.errors,
      rows: data?.length || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}
