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
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, cargo, email")
    .eq("id", userId)
    .maybeSingle()

  if (profile) {
    return NextResponse.json({
      id: userId,
      email: profile.email,
      name: profile.full_name || "",
      cargo: profile.cargo || "",
    })
  }

  const { data: allUsers } = await admin.auth.admin.listUsers()
  const u = allUsers?.users?.find((u: any) => u.id === userId)
  return NextResponse.json({
    id: userId,
    email: u?.email || "",
    name: u?.user_metadata?.name || u?.user_metadata?.full_name || "",
    cargo: u?.user_metadata?.cargo || "",
  })
}
