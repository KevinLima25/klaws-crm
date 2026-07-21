import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, cargo, email")
    .eq("id", user.id)
    .single()

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: profile?.full_name || user.user_metadata?.name || "",
    cargo: profile?.cargo || user.user_metadata?.cargo || "",
    avatar_url: user.user_metadata?.avatar_url,
  })
}
