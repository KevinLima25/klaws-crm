import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const queryUserId = searchParams.get("userId")

  let userId = queryUserId

  if (!userId) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    userId = user.id
  }

  const admin = createAdminClient()

  let name = ""
  let cargo = ""
  let email = ""

  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, cargo, email")
      .eq("id", userId)
      .maybeSingle()
    if (profile) {
      name = profile.full_name || ""
      cargo = profile.cargo || ""
      email = profile.email || ""
    }
  } catch {
    // cargo column may not exist yet
  }

  if (!email || !name) {
    try {
      const { data: allUsers } = await admin.auth.admin.listUsers()
      const u = allUsers?.users?.find((u: any) => u.id === userId)
      if (u) {
        email = email || u.email || ""
        name = name || u.user_metadata?.name || u.user_metadata?.full_name || ""
        cargo = cargo || u.user_metadata?.cargo || ""
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ id: userId, email, name, cargo })
}
