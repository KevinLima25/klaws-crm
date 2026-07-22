"use client"

import { useEffect, useState } from "react"
import { Key, User, RefreshCw, Plus, CheckCircle2, AlertCircle, X, Eye, EyeOff, Power } from "lucide-react"

type UserItem = {
  id: string
  email: string
  name: string
  cargo: string
  avatar_url?: string
  active?: boolean
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [createResult, setCreateResult] = useState<string | null>(null)
  const [form, setForm] = useState({ email: "", name: "", cargo: "", password: "" })
  const [creating, setCreating] = useState(false)

  // Modal Pop-up state for resetting password
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [resettingPwd, setResettingPwd] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // State for toggling user status
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        if (data.users) setUsers(data.users)
      }
    } catch {
      // quiet error
    } finally {
      setLoadingUsers(false)
    }
  }

  async function handleToggleActive(user: UserItem) {
    const nextState = !user.active
    setTogglingId(user.id)

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: nextState } : u))
    )

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, active: nextState }),
      })
      if (!res.ok) {
        // Revert if API failed
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, active: user.active } : u))
        )
      }
    } catch {
      // Revert if connection failed
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: user.active } : u))
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/sync-funcionarios", { method: "POST" })
      const data = await res.json()
      setSyncResult(JSON.stringify(data, null, 2))
      loadUsers()
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
      if (res.ok) {
        setForm({ email: "", name: "", cargo: "", password: "" })
        loadUsers()
      }
    } catch (err) {
      setCreateResult(`Error: ${err}`)
    } finally {
      setCreating(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser || !newPassword) return
    if (newPassword.length < 6) {
      setResetMessage({ type: "error", text: "A senha deve conter no mínimo 6 caracteres." })
      return
    }
    if (newPassword !== confirmPassword) {
      setResetMessage({ type: "error", text: "As senhas não coincidem." })
      return
    }

    setResettingPwd(true)
    setResetMessage(null)

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, password: newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setResetMessage({ type: "success", text: `Senha de ${selectedUser.name || selectedUser.email} atualizada com sucesso!` })
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setSelectedUser(null), 1500)
      } else {
        setResetMessage({ type: "error", text: data.error || "Erro ao redefinir a senha." })
      }
    } catch {
      setResetMessage({ type: "error", text: "Erro de conexão ao redefinir senha." })
    } finally {
      setResettingPwd(false)
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#131520] p-6 pt-12 font-sans">
      <div className="w-full max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#1e2030]">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Administração de Usuários</h1>
            <p className="text-sm text-slate-400">Gerencie acesso ao sistema e senhas dos usuários</p>
          </div>
          <button
            onClick={loadUsers}
            disabled={loadingUsers}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-[#1f2136] text-slate-300 hover:text-white border border-[#2a2d45] transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
            Atualizar Lista
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colunas 1 & 2: Lista de Usuários */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-[#1e2030] bg-[#1f2136] p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-400" />
                Usuários Cadastrados ({users.length})
              </h2>

              {loadingUsers && users.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Carregando usuários...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Nenhum usuário encontrado.</p>
              ) : (
                <div className="divide-y divide-[#2a2d45] overflow-hidden rounded-xl border border-[#2a2d45]">
                  {users.map((u) => {
                    const isActive = u.active !== false
                    return (
                      <div
                        key={u.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors ${
                          isActive ? "bg-[#171928] hover:bg-[#1c1e30]" : "bg-[#141522] opacity-75"
                        }`}
                      >
                        {/* Dados do Usuário */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ${
                              isActive
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                : "bg-slate-700/30 text-slate-500 border border-slate-700/50"
                            }`}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{u.name || "Sem Nome"}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {u.cargo}
                            </span>
                          </div>
                        </div>

                        {/* Ações: Switch On/Off + Botão Alterar Senha */}
                        <div className="flex items-center gap-4 shrink-0 justify-end">
                          
                          {/* Botão Estilo On/Off (Switch) */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              disabled={togglingId === u.id}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive ? "bg-emerald-500" : "bg-slate-700"
                              }`}
                              title={isActive ? "Acesso ao sistema Ativado (Clique para desativar)" : "Acesso ao sistema Desativado (Clique para ativar)"}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className={`text-xs font-semibold w-12 ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                              {isActive ? "Ativo" : "Inativo"}
                            </span>
                          </div>

                          {/* Botão Alterar Senha (Abre Modal Pop-up) */}
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setNewPassword("")
                              setConfirmPassword("")
                              setShowPassword(false)
                              setResetMessage(null)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/30"
                          >
                            <Key className="h-3.5 w-3.5" />
                            Alterar Senha
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coluna 3: Criar Usuário & Sincronizar */}
          <div className="space-y-6">

            {/* Card Create User */}
            <div className="rounded-2xl border border-[#1e2030] bg-[#1f2136] p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Criar Usuário
              </h2>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Cargo</label>
                  <input
                    type="text"
                    required
                    value={form.cargo}
                    onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: GERENTE"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Senha (opcional)</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Vazio = geração automática"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 transition-all disabled:opacity-60 shadow-md"
                >
                  {creating ? "Criando..." : "Criar Usuário"}
                </button>
              </form>

              {createResult && (
                <pre className="p-3 rounded-xl bg-[#131520] border border-[#2a2d45] text-[10px] text-slate-300 overflow-auto max-h-36 whitespace-pre-wrap">
                  {createResult}
                </pre>
              )}
            </div>

            {/* Card Sync */}
            <div className="rounded-2xl border border-[#1e2030] bg-[#1f2136] p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-400" />
                Sincronizar Funcionários
              </h2>
              <p className="text-xs text-slate-400">Importar dados dos funcionários para a base de profiles</p>

              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-xs font-bold text-white hover:shadow-lg transition-all disabled:opacity-60 shadow-md"
              >
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </button>

              {syncResult && (
                <pre className="p-3 rounded-xl bg-[#131520] border border-[#2a2d45] text-[10px] text-slate-300 overflow-auto max-h-36 whitespace-pre-wrap">
                  {syncResult}
                </pre>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* JANELA POP-UP (MODAL) PARA ALTERAR SENHA */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#2a2d45] bg-[#1f2136] p-6 shadow-2xl space-y-5 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2a2d45] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Alterar Senha</h3>
                  <p className="text-xs text-indigo-400 font-medium">{selectedUser.name || selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2d45] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Confirmar Nova Senha</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#131520] px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {resetMessage && (
                <div className={`flex items-center gap-2 text-xs rounded-xl p-3 border ${
                  resetMessage.type === "success"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                }`}>
                  {resetMessage.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{resetMessage.text}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={resettingPwd}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-all disabled:opacity-60"
                >
                  {resettingPwd ? "Atualizando..." : "Salvar Nova Senha"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="h-11 px-4 rounded-xl border border-[#2a2d45] bg-[#131520] text-xs font-medium text-slate-300 hover:text-white hover:bg-[#2a2d45] transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
