import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const { email, name, cargo, password } = await req.json()
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  const supabase = createAdminClient()
  const pwd = password || email.split("@")[0] + "Kl@ws2026"

  const { data: existing } = await supabase.auth.admin.getUserByEmail(email)
  if (existing?.user) {
    await supabase.from("profiles").upsert(
      { id: existing.user.id, email, full_name: name, cargo },
      { onConflict: "id" }
    )
    return NextResponse.json({ status: "updated", email, name, cargo })
  }

  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email,
    password: pwd,
    email_confirm: true,
    user_metadata: { name, cargo },
  })

  if (error || !newUser?.user) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  await supabase.from("profiles").upsert(
    { id: newUser.user.id, email, full_name: name, cargo },
    { onConflict: "id" }
  )

  return NextResponse.json({ status: "created", email, name, cargo })
}
