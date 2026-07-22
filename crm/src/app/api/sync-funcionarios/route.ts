import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  const supabase = createAdminClient()

  const { data: raw, error } = await supabase
    .from("funcionarios")
    .select("*")
    .limit(1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!raw?.length) return NextResponse.json({ error: "funcionarios table is empty" }, { status: 404 })

  const cols = Object.keys(raw[0]).map((c) => c.toLowerCase())
  const nomeCol = ["nome"].find((c) => cols.includes(c)) || "nome"
  const emailCol = ["email", "e-mail", "e_mail"].find((c) => cols.includes(c))
  const cargoCol = ["cargo", "cargo_atual", "cargo atual"].find((c) => cols.includes(c))

  if (!emailCol) return NextResponse.json({ error: "No email column found in funcionarios table" }, { status: 500 })

  const { data: funcionarios } = await supabase
    .from("funcionarios")
    .select(`${nomeCol}, ${emailCol}${cargoCol ? `, ${cargoCol}` : ""}`)

  if (!funcionarios) return NextResponse.json({ error: "Failed to fetch funcionarios" }, { status: 500 })

  const results: { nome: string; email: string; status: string }[] = []

  for (const f of funcionarios as Record<string, any>[]) {
    const email = (f[emailCol] || "").toString().trim().toLowerCase()
    if (!email) continue

    const nome = (f[nomeCol] || "").toString().trim()
    const cargo = cargoCol ? (f[cargoCol] || "").toString().trim() : ""

    const { data: existing } = await supabase.auth.admin.listUsers()
    const userExists = existing?.users?.some((u) => u.email === email)

    if (userExists) {
      const found = existing?.users?.find((u) => u.email === email)
      if (found?.id) {
        await supabase.from("profiles").upsert(
          { id: found.id, email, full_name: nome, cargo },
          { onConflict: "id" }
        )
      }
      results.push({ nome, email, status: "already_exists" })
      continue
    }

    const password = email.split("@")[0] + "Kl@ws2026"

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: nome, cargo },
    })

    if (createError || !newUser?.user) {
      results.push({ nome, email, status: `error: ${createError?.message}` })
      continue
    }

    await supabase.from("profiles").upsert(
      { id: newUser.user.id, email, full_name: nome, cargo },
      { onConflict: "id" }
    )

    results.push({ nome, email, status: "created" })
  }

  return NextResponse.json({
    columns_detected: { nome: nomeCol, email: emailCol, cargo: cargoCol },
    total: funcionarios.length,
    created: results.filter((r) => r.status === "created").length,
    already_exists: results.filter((r) => r.status === "already_exists").length,
    errors: results.filter((r) => r.status.startsWith("error")).length,
    results,
  })
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to sync funcionarios to auth users",
    example: "curl -X POST https://your-domain/api/sync-funcionarios",
  })
}
