"use client"

import { useState } from "react"

export default function AdminPage() {
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [createResult, setCreateResult] = useState<string | null>(null)
  const [form, setForm] = useState({ email: "", name: "", cargo: "", password: "" })
  const [creating, setCreating] = useState(false)

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/sync-funcionarios", { method: "POST" })
      const data = await res.json()
      setSyncResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setSyncResult(`Error: ${err}`)
    } finally {
      setSyncing(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateResult(null)
    try {
      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setCreateResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setCreateResult(`Error: ${err}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#131520] p-4 pt-16 font-sans">
      <div className="w-full max-w-lg space-y-6">
        {/* Card Sync */}
        <div className="rounded-2xl border border-[#1e2030] bg-[#1f2136] p-8 shadow-xl">
          <h1 className="text-xl font-bold text-white mb-1">Admin</h1>
          <p className="text-sm text-slate-400 mb-6">Gerenciar usuários do sistema</p>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {syncing ? "Sincronizando..." : "Sincronizar Funcionários"}
          </button>

          {syncResult && (
            <pre className="mt-4 p-4 rounded-xl bg-[#131520] border border-[#2a2d45] text-xs text-slate-300 overflow-auto max-h-60 whitespace-pre-wrap">
              {syncResult}
            </pre>
          )}
        </div>

        {/* Card Create User */}
        <div className="rounded-2xl border border-[#1e2030] bg-[#1f2136] p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Criar Usuário</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Nome</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Cargo</label>
              <input
                type="text"
                required
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Ex: GERENTE"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1">Senha (opcional)</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Deixe vazio para gerar automática"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-all disabled:opacity-60"
            >
              {creating ? "Criando..." : "Criar Usuário"}
            </button>
          </form>

          {createResult && (
            <pre className="mt-4 p-4 rounded-xl bg-[#131520] border border-[#2a2d45] text-xs text-slate-300 overflow-auto whitespace-pre-wrap">
              {createResult}
            </pre>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          Acesse Supabase Dashboard &gt; Authentication &gt; Settings &gt; desative "Confirm email"
        </p>
      </div>
    </div>
  )
}
