"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Upload, Camera, Key, Eye, EyeOff, ShieldAlert } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { LoadingState } from "@/components/loading-state"

export default function PerfilPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [cargo, setCargo] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user
      if (!u) { setLoading(false); return }
      setUserId(u.id)
      setEmail(u.email || "")
      setName(u.user_metadata?.name || u.email?.split("@")[0] || "")
      setCargo(u.user_metadata?.cargo || "")

      const res = await fetch("/api/me?userId=" + u.id)
      if (res.ok) {
        const profile = await res.json()
        if (profile.name) setName(profile.name)
        if (profile.cargo) setCargo(profile.cargo)
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
      }
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/profile?userId=" + userId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: "Perfil atualizado com sucesso!" })
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao salvar" })
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    if (!newPassword) { setPasswordMessage({ type: "error", text: "Digite a nova senha." }); return }
    if (newPassword.length < 6) { setPasswordMessage({ type: "error", text: "A nova senha deve ter pelo menos 6 caracteres." }); return }
    if (newPassword !== confirmPassword) { setPasswordMessage({ type: "error", text: "As senhas não coincidem." }); return }

    setUpdatingPassword(true)
    setPasswordMessage(null)
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password: newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Sua senha foi atualizada com sucesso!" })
        setNewPassword(""); setConfirmPassword("")
      } else {
        setPasswordMessage({ type: "error", text: data.error || "Erro ao atualizar a senha" })
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Erro de conexão ao atualizar senha" })
    } finally {
      setUpdatingPassword(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const formData = new FormData()
    formData.append("file", file)
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/upload-avatar?userId=" + userId, { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.avatar_url) { setAvatarUrl(data.avatar_url); setMessage({ type: "success", text: "Foto atualizada!" }) }
      else { setMessage({ type: "error", text: data.error || "Erro ao enviar foto" }) }
    } catch { setMessage({ type: "error", text: "Erro de conexão" }) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131520] p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <PageHeader title="Meu Perfil" description="Carregando suas informações..." />
          <LoadingState variant="skeleton" rows={6} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#131520] p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais e de acesso" />

        {/* Avatar */}
        <div className="bg-[#1a1c30] rounded-2xl border border-[#1e2030] p-8 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md hover:bg-emerald-400 transition-all disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
            <p className="text-xs text-slate-400">Clique no botão para alterar a foto</p>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="bg-[#1a1c30] rounded-2xl border border-[#1e2030] p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1e2030] pb-3">Informações Cadastrais</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Email <span className="text-slate-500">(acesso ao sistema)</span></label>
            <input type="email" value={email} disabled className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-slate-400 cursor-not-allowed" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Nome</label>
            <input
              type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 inline mr-1 text-indigo-400" />
              Cargo
            </label>
            <input type="text" value={cargo} disabled className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-indigo-400 font-medium cursor-not-allowed" />
          </div>

          {message && (
            <p className={`text-sm rounded-xl px-4 py-3 border ${message.type === "success" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-rose-400 bg-rose-500/10 border-rose-500/30"}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSave} disabled={saving || !userId}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

        {/* Senha */}
        <div className="bg-[#1a1c30] rounded-2xl border border-[#1e2030] p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-[#1e2030] pb-3">
            <Key className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Alterar Senha</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Nova Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Confirmar Nova Senha</label>
              <input
                type={showPassword ? "text" : "password"} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {passwordMessage && (
              <p className={`text-sm rounded-xl px-4 py-3 border ${passwordMessage.type === "success" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-rose-400 bg-rose-500/10 border-rose-500/30"}`}>
                {passwordMessage.text}
              </p>
            )}

            <button type="submit" disabled={updatingPassword || !userId}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-60"
            >
              {updatingPassword ? "Atualizando Senha..." : "Atualizar Senha"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
