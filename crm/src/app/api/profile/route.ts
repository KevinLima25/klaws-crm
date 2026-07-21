import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const { name, avatar_url } = await req.json()

  const admin = createAdminClient()

  const updateData: Record<string, string> = {}
  if (name !== undefined) updateData.full_name = name
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { error } = await admin.from("profiles").upsert(
    { id: userId, ...updateData },
    { onConflict: "id" }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (name !== undefined) {
    try {
      const { data: users } = await admin.auth.admin.listUsers()
      const existing = users?.users?.find((u: any) => u.id === userId)
      if (existing) {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { ...existing.user_metadata, name },
        })
      }
    } catch {
      // ignore metadata update failure
    }
  }

  return NextResponse.json({ status: "ok", ...updateData })
}
