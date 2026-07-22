import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("agentes_config")
    .select("*")
    .order("cargo")
    .order("agente")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ configs: data })
}

export async function PUT(request: Request) {
  const admin = createAdminClient()

  const { configs } = await request.json()
  if (!Array.isArray(configs)) {
    return NextResponse.json({ error: "configs must be an array" }, { status: 400 })
  }

  const errors: string[] = []

  for (const c of configs) {
    const { error } = await admin
      .from("agentes_config")
      .upsert(
        {
          cargo: c.cargo,
          agente: c.agente,
          enabled: c.enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "cargo, agente" }
      )

    if (error) errors.push(`${c.cargo}/${c.agente}: ${error.message}`)
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 })
  }

  const { data } = await admin
    .from("agentes_config")
    .select("*")
    .order("cargo")
    .order("agente")

  return NextResponse.json({ configs: data })
}
