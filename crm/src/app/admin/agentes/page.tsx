"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, ShieldAlert } from "lucide-react"

type AgentConfig = {
  id: string
  cargo: string
  agente: string
  enabled: boolean
}

const AGENTE_LABELS: Record<string, string> = {
  comprovante: "Comprovante (OCR)",
  conciliacao: "Conciliação (CTN + Extrato)",
  atendimento: "Atendimento (Agendamentos)",
}

const AGENTE_DESCRIPTIONS: Record<string, string> = {
  comprovante: "Processar PDFs e imagens de comprovantes de pagamento",
  conciliacao: "Conciliar baixas do CTN com extratos bancários",
  atendimento: "Gerenciar agendamentos de cancelamento (Google Calendar)",
}

export default function AdminAgentesPage() {
  const [configs, setConfigs] = useState<AgentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cargos, setCargos] = useState<string[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const me = await fetch("/api/me").then(r => r.json())
      const canAdmin = me.cargo?.toUpperCase().includes("ASSISTENTE FINANCEIRO") || me.cargo?.toUpperCase().includes("GERENTE")
      setHasAccess(canAdmin)
      if (!canAdmin) { setLoading(false); return }

      const distinct = await supabase.from("funcionarios").select("cargo").not("cargo", "is", null)
      const cargoList = [...new Set((distinct.data || []).map(r => r.cargo).filter(Boolean))].sort() as string[]
      setCargos(cargoList)

      const res = await fetch("/api/agentes-config")
      const data = await res.json()
      if (data.configs) setConfigs(data.configs)
      setLoading(false)
    }
    init()
  }, [])

  async function toggleConfig(cargo: string, agente: string, enabled: boolean) {
    setConfigs((prev) =>
      prev.map((c) => (c.cargo === cargo && c.agente === agente ? { ...c, enabled } : c))
    )
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/agentes-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Erro ao salvar")
      }
    } catch {
      setError("Erro de conexão ao salvar")
    }
    setSaving(false)
  }

  function getConfig(cargo: string, agente: string): boolean {
    return configs.find((c) => c.cargo === cargo && c.agente === agente)?.enabled ?? false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#131520]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#131520]">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-rose-400 mx-auto" />
          <p className="text-slate-400 text-sm">Acesso restrito a ASSISTENTE FINANCEIRO ou GERENTE</p>
        </div>
      </div>
    )
  }

  const agentes = Object.keys(AGENTE_LABELS)

  return (
    <div className="min-h-screen bg-[#131520] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Configuração de Agentes</h1>
            <p className="text-sm text-slate-400 mt-1">Defina quais cargos podem acessar cada agente no chat</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#1a1c30] rounded-xl border border-[#1e2030] overflow-hidden">
          <div className="grid grid-cols-[1fr_repeat(3,minmax(120px,1fr))] gap-4 p-4 border-b border-[#1e2030] bg-[#131520]/50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <div>Cargo</div>
            {agentes.map((a) => (
              <div key={a} className="text-center">{AGENTE_LABELS[a]}</div>
            ))}
          </div>

          {cargos.map((cargo) => (
            <div
              key={cargo}
              className="grid grid-cols-[1fr_repeat(3,minmax(120px,1fr))] gap-4 p-4 border-b border-[#1e2030] last:border-0 items-center hover:bg-[#1f2136]/50 transition-colors"
            >
              <div className="text-sm font-medium text-slate-200">{cargo}</div>
              {agentes.map((agente) => (
                <div key={agente} className="flex justify-center">
                  <Switch
                    checked={getConfig(cargo, agente)}
                    onCheckedChange={(checked) => toggleConfig(cargo, agente, checked)}
                    className="data-[state=checked]:bg-indigo-600"
                  />
                </div>
              ))}
            </div>
          ))}

          {cargos.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nenhum cargo encontrado. Sincronize os funcionários primeiro.
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {agentes.map((agente) => (
            <div key={agente} className="bg-[#1a1c30] rounded-xl border border-[#1e2030] p-4">
              <h3 className="text-sm font-bold text-white mb-1">{AGENTE_LABELS[agente]}</h3>
              <p className="text-xs text-slate-500">{AGENTE_DESCRIPTIONS[agente]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
