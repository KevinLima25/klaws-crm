"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, ShieldAlert, Bot, CheckCircle2, Cpu, Zap, ShieldCheck } from "lucide-react"

type AgentConfig = {
  id?: string
  cargo: string
  agente: string
  enabled: boolean
}

const AGENTE_LABELS: Record<string, string> = {
  comprovante: "Agente Comprovante (OCR)",
  conciliacao: "Agente Conciliação Bancária",
  atendimento: "Agente Atendimento & Agendamentos",
  roteador: "Master Router N8N",
}

const AGENTE_DESCRIPTIONS: Record<string, string> = {
  comprovante: "WFCRM001comp01: Processa comprovantes (PDF/Imagem) com extração OCR e validação bancária no Supabase.",
  conciliacao: "WFCRMBaixas: Concilia dados do CTN e extratos bancários automaticamente com status de liquidação.",
  atendimento: "WFCRMAgendamento: Gerencia solicitações de agendamento, cancelamento e eventos no Google Calendar.",
  roteador: "WFCRM001chat01: Roteador principal N8N responsável por filtrar mídias e redirecionar comandos de chat.",
}

const DEFAULT_CARGOS = [
  "ADMINISTRADOR",
  "GERENTE",
  "ASSISTENTE FINANCEIRO",
  "COORDENADOR",
  "VENDEDOR",
  "COBRANÇA",
  "ATENDIMENTO",
]

export default function AdminAgentesPage() {
  const [configs, setConfigs] = useState<AgentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cargos, setCargos] = useState<string[]>(DEFAULT_CARGOS)
  const [hasAccess, setHasAccess] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      let userCargo = ""
      if (user) {
        userCargo = user.user_metadata?.cargo || ""
        const meRes = await fetch("/api/me?userId=" + user.id)
        if (meRes.ok) {
          const me = await meRes.json()
          if (me.cargo) userCargo = me.cargo
        }
      }

      const cUpper = userCargo.toUpperCase()
      const canAdmin =
        !cUpper ||
        cUpper.includes("ADMIN") ||
        cUpper.includes("GERENTE") ||
        cUpper.includes("ASSISTENTE") ||
        cUpper.includes("FINANCEIRO")

      setHasAccess(canAdmin)
      if (!canAdmin) {
        setLoading(false)
        return
      }

      // Buscar cargos cadastrados no banco
      const distinct = await supabase.from("funcionarios").select("cargo").not("cargo", "is", null)
      const dbCargos = (distinct.data || []).map((r) => r.cargo?.trim()).filter(Boolean) as string[]

      const combinedCargos = Array.from(new Set([...DEFAULT_CARGOS, ...dbCargos])).sort()
      setCargos(combinedCargos)

      try {
        const res = await fetch("/api/agentes-config")
        if (res.ok) {
          const data = await res.json()
          if (data.configs) setConfigs(data.configs)
        }
      } catch (err) {
        console.error("Erro ao carregar configuracoes:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  function toggleConfig(cargo: string, agente: string, enabled: boolean) {
    setConfigs((prev) => {
      const exists = prev.some((c) => c.cargo === cargo && c.agente === agente)
      if (exists) {
        return prev.map((c) => (c.cargo === cargo && c.agente === agente ? { ...c, enabled } : c))
      }
      return [...prev, { cargo, agente, enabled }]
    })
  }

  function getConfig(cargo: string, agente: string): boolean {
    const item = configs.find((c) => c.cargo === cargo && c.agente === agente)
    // Por padrão, administradores e gerentes possuem acesso liberado
    if (!item) {
      if (cargo.includes("ADMIN") || cargo.includes("GERENTE")) return true
      return false
    }
    return item.enabled
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccessMsg("")

    // Preparar conjunto completo de permissões para todos os cargos x agentes
    const agentesList = Object.keys(AGENTE_LABELS)
    const fullConfigs: AgentConfig[] = []

    for (const c of cargos) {
      for (const a of agentesList) {
        fullConfigs.push({
          cargo: c,
          agente: a,
          enabled: getConfig(c, a),
        })
      }
    }

    try {
      const res = await fetch("/api/agentes-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: fullConfigs }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Erro ao salvar permissões")
      } else {
        const data = await res.json()
        if (data.configs) setConfigs(data.configs)
        setSuccessMsg("Permissões de acesso aos Agentes N8N salvas com sucesso!")
        setTimeout(() => setSuccessMsg(""), 4000)
      }
    } catch {
      setError("Erro de conexão ao salvar permissões")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#131520]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-xs text-slate-400 font-medium">Carregando permissões dos Agentes N8N...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#131520] p-6">
        <div className="text-center space-y-4 bg-[#1a1c30] p-8 rounded-2xl border border-[#1e2030] max-w-md">
          <ShieldAlert className="h-12 w-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Acesso Restrito</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Apenas usuários com permissão de <strong>ADMINISTRADOR</strong>, <strong>GERENTE</strong> ou{" "}
            <strong>ASSISTENTE FINANCEIRO</strong> podem alterar as permissões dos Agentes N8N.
          </p>
        </div>
      </div>
    )
  }

  const agentes = Object.keys(AGENTE_LABELS)

  return (
    <div className="min-h-screen bg-[#131520] p-6 md:p-10 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1c30] p-6 rounded-2xl border border-[#1e2030] shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Bot className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Permissões de Agentes N8N</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Automações IA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Defina com chaves <strong>On / Off</strong> quais cargos do CRM possuem acesso a cada Agente de automação no N8N.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 gap-2 shrink-0"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Permissões
          </Button>
        </div>

        {/* Notificações Feedback */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Tabela de Matriz de Permissões por Cargo e Agente */}
        <div className="bg-[#1a1c30] rounded-2xl border border-[#1e2030] shadow-xl overflow-hidden">
          <div className="p-4 bg-[#131520]/80 border-b border-[#1e2030] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Matriz de Acesso por Cargo
            </span>
            <span className="text-[11px] text-slate-500">
              Total de Cargos: <strong className="text-slate-300">{cargos.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2030] bg-[#131520]/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 pl-6 min-w-[200px]">Cargo do Sistema</th>
                  {agentes.map((a) => (
                    <th key={a} className="p-4 text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-slate-200">{AGENTE_LABELS[a]}</span>
                        <span className="text-[9px] text-indigo-400 lowercase font-mono">agente: {a}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2030]">
                {cargos.map((cargo) => (
                  <tr
                    key={cargo}
                    className="hover:bg-[#1f2136]/50 transition-colors group"
                  >
                    <td className="p-4 pl-6 text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500/50 group-hover:bg-indigo-400"></span>
                      {cargo}
                    </td>

                    {agentes.map((agente) => {
                      const active = getConfig(cargo, agente)
                      return (
                        <td key={agente} className="p-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1.5">
                            <Switch
                              checked={active}
                              onCheckedChange={(checked) => toggleConfig(cargo, agente, checked)}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                active
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-slate-800 text-slate-500 border border-slate-700/50"
                              }`}
                            >
                              {active ? "On (Permitido)" : "Off (Bloqueado)"}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards Informativos dos Agentes N8N */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-400" /> Resumo das Automações N8N
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentes.map((agente) => (
              <div
                key={agente}
                className="bg-[#1a1c30] rounded-xl border border-[#1e2030] p-4 space-y-2 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white">{AGENTE_LABELS[agente]}</h3>
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{AGENTE_DESCRIPTIONS[agente]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
