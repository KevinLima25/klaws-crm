"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Upload, Camera, ShieldAlert } from "lucide-react"

export default function PerfilPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [cargo, setCargo] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user
      if (!u) return
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    const formData = new FormData()
    formData.append("file", file)

    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/upload-avatar?userId=" + userId, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.avatar_url) {
        setAvatarUrl(data.avatar_url)
        setMessage({ type: "success", text: "Foto atualizada!" })
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao enviar foto" })
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fc] font-sans">
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Meu Perfil</h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie suas informações pessoais</p>
        </div>

        {/* Foto */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <p className="text-xs text-slate-400">Clique no botão para alterar a foto</p>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Email (acesso ao sistema)</label>
            <input
              type="email"
              value={email}
              disabled
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 inline mr-1 text-indigo-500" />
              Cargo
            </label>
            <input
              type="text"
              value={cargo}
              disabled
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-indigo-600 font-medium cursor-not-allowed"
            />
          </div>

          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 border ${
              message.type === "success"
                ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                : "text-red-500 bg-red-50 border-red-200"
            }`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !userId}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  )
}
