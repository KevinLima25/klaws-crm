import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const admin = createAdminClient()

    const { data: authData, error: authError } = await admin.auth.admin.listUsers()
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const { data: profiles } = await admin.from("profiles").select("*")

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    const users = (authData.users || []).map((u: any) => {
      const profile = profileMap.get(u.id) || {}
      
      // Determine active status: true if not banned and not marked inactive in metadata/profile
      const isBanned = u.banned_until && new Date(u.banned_until) > new Date()
      const isActiveMeta = u.user_metadata?.active !== false
      const isActiveProfile = profile.active !== false
      const active = !isBanned && isActiveMeta && isActiveProfile

      return {
        id: u.id,
        email: u.email,
        name: profile.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "",
        cargo: profile.cargo || u.user_metadata?.cargo || "NÃO DEFINIDO",
        avatar_url: profile.avatar_url || "",
        active: active,
        created_at: u.created_at,
      }
    })

    return NextResponse.json({ users })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, password, active } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Process Password Update
    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
      }
      const { error } = await admin.auth.admin.updateUserById(userId, { password })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ status: "ok", message: "Senha atualizada com sucesso!" })
    }

    // Process Active/Inactive Toggle
    if (active !== undefined) {
      const { data: userData } = await admin.auth.admin.getUserById(userId)
      const existingUser = userData?.user

      const banDuration = active ? "none" : "876600h" // 100 years ban if disabled
      const userMeta = existingUser ? { ...existingUser.user_metadata, active } : { active }

      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: banDuration,
        user_metadata: userMeta,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Try updating profile active field if it exists
      try {
        await admin.from("profiles").upsert({ id: userId, active }, { onConflict: "id" })
      } catch {
        // ignore if active column does not exist
      }

      return NextResponse.json({
        status: "ok",
        active,
        message: active ? "Usuário ativado com sucesso!" : "Acesso do usuário desativado!",
      })
    }

    return NextResponse.json({ error: "Nenhum campo para atualizar informado" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno do servidor" }, { status: 500 })
  }
}
