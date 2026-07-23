"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, ShieldAlert, CheckCircle2, AlertTriangle, Search } from "lucide-react"

type Sumario = {
  lote_execucao: string
  total_processados: number
  conciliados_exatos: number
  conciliados_documento: number
  aguardando_documento: number
  pendentes_sem_correspondencia: number
  divergencia_valor: number
  divergencia_data: number
  divergencia_valor_data: number
  ambiguos: number
  duplicados: number
  dados_insuficientes: number
  pendentes_conferencia: number
  erros: string[]
  executado_em: string
  motor_version: string
}

type ConciliacaoRow = {
  id: string
  id_importacao_a: string
  id_importacao_b: string
  status: string
  regra_aplicada: string
  valor_origem: number | null
  valor_destino: number | null
  diferenca_valor: number | null
  data_origem: string | null
  data_destino: string | null
  motivo: string | null
  divergencias: any
  conferido: boolean
  lote_execucao: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  CONCILIADO_EXATO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CONCILIADO_DOCUMENTO: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  AGUARDANDO_DOCUMENTO: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  PENDENTE_SEM_CORRESPONDENCIA: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  DIVERGENCIA_VALOR: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DIVERGENCIA_DATA: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  DIVERGENCIA_VALOR_DATA: "bg-red-500/10 text-red-400 border-red-500/20",
  AMBIGUO_MULTIPLOS_CANDIDATOS: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DUPLICADO: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  DADOS_INSUFICIENTES: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  PENDENTE_CONFERENCIA: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
}

export default function ConciliacaoPage() {
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)
  const [sumario, setSumario] = useState<Sumario | null>(null)
  const [rows, setRows] = useState<ConciliacaoRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [hasAccess, setHasAccess] = useState(false)
  const [error, setError] = useState("")

  const limit = 50

  const loadData = useCallback(async () => {
    try {
      let url = `/api/conciliacao?page=${page}&limit=${limit}`
      if (statusFilter) url += `&status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRows(data.data || [])
        setTotal(data.total || 0)
      }
    } catch {}
  }, [page, statusFilter])

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      let userCargo = ""
      if (user) {
        userCargo = user.user_metadata?.cargo || ""
        try {
          const meRes = await fetch("/api/me?userId=" + user.id)
          if (meRes.ok) {
            const me = await meRes.json()
            if (me.cargo) userCargo = me.cargo
          }
        } catch {}
      }

      const cUpper = userCargo.toUpperCase()
      setHasAccess(
        cUpper.includes("ADMIN") ||
        cUpper.includes("GERENTE") ||
        cUpper.includes("ASSISTENTE") ||
        cUpper.includes("FINANCEIRO")
      )
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (hasAccess) loadData()
  }, [hasAccess, loadData])

  async function handleExecutar() {
    setExecutando(true)
    setError("")
    try {
      const res = await fetch("/api/conciliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok && data.sumario) {
        setSumario(data.sumario)
        setPage(1)
        loadData()
      } else {
        setError(data.error || "Erro ao executar")
      }
    } catch {
      setError("Erro de conexao com o servidor")
    } finally {
      setExecutando(false)
    }
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
      <div className="flex items-center justify-center min-h-screen bg-[#131520] p-6">
        <div className="text-center space-y-4 bg-[#1a1c30] p-8 rounded-2xl border border-[#1e2030] max-w-md">
          <ShieldAlert className="h-12 w-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Acesso Restrito</h2>
          <p className="text-slate-400 text-xs">
            Apenas GERENTE ou ASSISTENTE FINANCEIRO podem acessar a Conciliacao Bancaria.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#131520] p-6 font-sans text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1c30] p-6 rounded-2xl border border-[#1e2030]">
          <div>
            <h1 className="text-2xl font-bold text-white">Conciliacao Bancaria</h1>
            <p className="text-xs text-slate-400 mt-1">
              Motor deterministico de conciliacao entre extratos, CTN e comprovantes.
            </p>
          </div>
          <Button
            onClick={handleExecutar}
            disabled={executando}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl gap-2"
          >
            {executando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {executando ? "Executando..." : "Executar Conciliacao"}
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {sumario && (
          <div className="bg-[#1a1c30] rounded-2xl border border-[#1e2030] p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Resultado da Ultima Execucao
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard label="Processados" value={sumario.total_processados} color="slate" />
              <StatCard label="Exatos" value={sumario.conciliados_exatos} color="emerald" />
              <StatCard label="Documento" value={sumario.conciliados_documento} color="sky" />
              <StatCard label="Aguard. Doc." value={sumario.aguardando_documento} color="indigo" />
              <StatCard label="Pendentes" value={sumario.pendentes_sem_correspondencia} color="slate" />
              <StatCard label="Div. Valor" value={sumario.divergencia_valor} color="amber" />
              <StatCard label="Div. Data" value={sumario.divergencia_data} color="orange" />
              <StatCard label="Div. V+D" value={sumario.divergencia_valor_data} color="red" />
              <StatCard label="Ambiguos" value={sumario.ambiguos} color="purple" />
              <StatCard label="Duplicados" value={sumario.duplicados} color="rose" />
              <StatCard label="Insuficientes" value={sumario.dados_insuficientes} color="gray" />
            </div>
            {sumario.erros.length > 0 && (
              <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                <p className="text-xs text-rose-400 font-semibold">Erros:</p>
                {sumario.erros.map((e, i) => (
                  <p key={i} className="text-xs text-rose-300 mt-1">{e}</p>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-4">
              Lote: {sumario.lote_execucao} | Motor: v{sumario.motor_version} | Executado em: {new Date(sumario.executado_em).toLocaleString("pt-BR")}
            </p>
          </div>
        )}

        <div className="bg-[#1a1c30] rounded-2xl border border-[#1e2030] overflow-hidden">
          <div className="p-4 border-b border-[#1e2030] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Search className="h-4 w-4" /> Registros ({total})
            </span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="bg-[#131520] border border-[#1e2030] rounded-lg px-3 py-1.5 text-xs text-slate-300"
            >
              <option value="">Todos os status</option>
              {Object.keys(STATUS_COLORS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1e2030] bg-[#131520]/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-3 pl-4">Status</th>
                  <th className="p-3">Regra</th>
                  <th className="p-3">Valor Origem</th>
                  <th className="p-3">Valor Destino</th>
                  <th className="p-3">Dif.</th>
                  <th className="p-3">Data Origem</th>
                  <th className="p-3">Data Destino</th>
                  <th className="p-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2030]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#1f2136]/30 transition-colors">
                    <td className="p-3 pl-4">
                      <Badge className={`${STATUS_COLORS[row.status] || "bg-slate-500/10 text-slate-400"} text-[10px] font-bold border`}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-slate-400 font-mono">{row.regra_aplicada}</td>
                    <td className="p-3 text-xs text-slate-300">
                      {row.valor_origem != null ? `R$ ${row.valor_origem.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-3 text-xs text-slate-300">
                      {row.valor_destino != null ? `R$ ${row.valor_destino.toFixed(2)}` : "-"}
                    </td>
                    <td className={`p-3 text-xs font-mono ${row.diferenca_valor && row.diferenca_valor !== 0 ? "text-amber-400" : "text-slate-500"}`}>
                      {row.diferenca_valor != null ? `R$ ${row.diferenca_valor.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-3 text-xs text-slate-400">{row.data_origem || "-"}</td>
                    <td className="p-3 text-xs text-slate-400">{row.data_destino || "-"}</td>
                    <td className="p-3 text-xs text-slate-500 max-w-[200px] truncate">{row.motivo || "-"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-slate-500">
                      Nenhum registro encontrado. Execute a conciliacao primeiro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > limit && (
            <div className="p-4 border-t border-[#1e2030] flex items-center justify-between">
              <Button
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="text-xs"
              >
                Anterior
              </Button>
              <span className="text-xs text-slate-400">
                Pagina {page} de {Math.ceil(total / limit)}
              </span>
              <Button
                variant="ghost"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(page + 1)}
                className="text-xs"
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    gray: "text-gray-400 bg-gray-500/10 border-gray-500/20",
    slate: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  }

  return (
    <div className={`rounded-xl border p-3 ${colorMap[color] || colorMap.slate}`}>
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
