"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { LoadingState } from "@/components/loading-state"
import { EmptyState } from "@/components/empty-state"
import { AlertTriangle, FileText, ArrowRight, RefreshCw, Filter, X } from "lucide-react"

interface PendenciaDetalhes {
  divergencias?: Record<string, string>
  [key: string]: unknown
}

type PendenciaItem = {
  id: string
  tipo: string
  tipoLabel: string
  identificador: string
  matricula: string
  data: string
  origem: string
  valor: number | null
  motivo: string
  status: string
  prioridade: string
  detalhes: PendenciaDetalhes
}

const TIPO_FILTROS = [
  { value: "", label: "Todos" },
  { value: "conciliacao", label: "Conciliação" },
  { value: "comprovante", label: "Comprovante" },
]

const STATUS_OPTIONS: Record<string, { value: string; label: string }[]> = {
  conciliacao: [
    { value: "", label: "Todos" },
    { value: "PENDENTE_SEM_CORRESPONDENCIA", label: "Sem Correspondência" },
    { value: "DIVERGENCIA_VALOR", label: "Divergência Valor" },
    { value: "DIVERGENCIA_DATA", label: "Divergência Data" },
    { value: "DIVERGENCIA_VALOR_DATA", label: "Divergência Valor+Data" },
    { value: "AMBIGUO_MULTIPLOS_CANDIDATOS", label: "Ambíguo" },
    { value: "DUPLICADO", label: "Duplicado" },
    { value: "DADOS_INSUFICIENTES", label: "Dados Insuficientes" },
    { value: "PENDENTE_CONFERENCIA", label: "Conferência" },
    { value: "AGUARDANDO_DOCUMENTO", label: "Aguardando Documento" },
  ],
  comprovante: [
    { value: "", label: "Todos" },
    { value: "pendente", label: "Pendente" },
    { value: "conferencia", label: "Conferência" },
  ],
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
  pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  conferencia: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  aprovado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

const PRIORIDADE_LABELS: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "text-red-400" },
  media: { label: "Média", color: "text-amber-400" },
  baixa: { label: "Baixa", color: "text-slate-400" },
}

export default function PendenciasPage() {
  const [items, setItems] = useState<PendenciaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [selectedItem, setSelectedItem] = useState<PendenciaItem | null>(null)
  const [userCargo, setUserCargo] = useState<string>("")
  const [canView, setCanView] = useState(false)
  const limit = 50

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.cargo) {
        const cargo = (user.user_metadata.cargo as string).toUpperCase()
        setUserCargo(cargo)
        setCanView(
          cargo.includes("ADMIN") ||
          cargo.includes("GERENTE") ||
          cargo.includes("FINANCEIRO") ||
          cargo.includes("ASSISTENTE")
        )
      }
    })
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filtroTipo) params.set("tipo", filtroTipo)
      if (filtroStatus) params.set("status", filtroStatus)
      const res = await fetch(`/api/pendencias?${params}`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Erro ao carregar pendências")
      }
      const json = await res.json()
      setItems(json.data || [])
      setTotal(json.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, filtroTipo, filtroStatus])

  useEffect(() => {
    if (canView) loadData()
  }, [canView, loadData])

  useEffect(() => {
    setPage(1)
  }, [filtroTipo, filtroStatus])

  function handleOpenDetalhe(item: PendenciaItem) {
    setSelectedItem(item)
  }

  function handleAbrirRegistro(item: PendenciaItem) {
    if (item.tipo === "conciliacao") {
      window.open(`/admin/conciliacao`, "_blank")
    } else if (item.tipo === "comprovante") {
      window.open(`/admin/conciliacao`, "_blank")
    }
  }

  function handleAbrirTimeline(item: PendenciaItem) {
    const params = new URLSearchParams()
    if (item.matricula) params.set("matricula", item.matricula)
    window.open(`/crm/clientes/timeline?${params}`, "_blank")
  }

  function formatDate(iso: string) {
    if (!iso) return "-"
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  function formatValor(v: number | null) {
    if (v === null || v === undefined) return "-"
    return `R$ ${v.toFixed(2).replace(".", ",")}`
  }

  function statusLabel(status: string) {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  if (!canView && userCargo) {
    return (
      <div className="min-h-screen bg-[#131520] p-4 md:p-6 lg:p-8 font-sans">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-[#1e2030] bg-[#1f2136] p-8 shadow-xl text-center">
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">Sem permissão</h2>
            <p className="text-sm text-slate-400">Você não tem acesso a esta funcionalidade.</p>
          </div>
        </div>
      </div>
    )
  }

  const paginas = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-[#131520] p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Central de Pendências"
          description="Registros que exigem ação humana"
          actions={
            <Button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 min-h-11 md:min-h-0 px-3.5 py-2 text-xs font-medium rounded-xl bg-[#1f2136] text-slate-300 hover:text-white border border-[#2a2d45] transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Filtros:</span>
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setFiltroStatus("") }}
            className="bg-[#131520] border border-[#1e2030] rounded-lg min-h-11 md:min-h-0 px-3 py-1.5 text-xs text-slate-300"
          >
            {TIPO_FILTROS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="bg-[#131520] border border-[#1e2030] rounded-lg min-h-11 md:min-h-0 px-3 py-1.5 text-xs text-slate-300"
          >
            {(STATUS_OPTIONS[filtroTipo] || STATUS_OPTIONS.conciliacao).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500">
            {total} pendência{total !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <LoadingState variant="skeleton" rows={6} message="Carregando pendências..." />
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhuma pendência encontrada"
            description="Todos os registros estão em dia."
          />
        ) : (
          <div className="rounded-2xl border border-[#1e2030] bg-[#1f2136] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2d45] bg-[#171928]">
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 min-h-11">Tipo</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 min-h-11">Identificador</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 min-h-11">Matrícula</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 min-h-11">Data</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 min-h-11">Valor</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 min-h-11">Status</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 min-h-11">Prioridade</th>
                    <th className="text-left p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 min-h-11">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d45]">
                  {items.map((item) => {
                    const prioridade = PRIORIDADE_LABELS[item.prioridade] || PRIORIDADE_LABELS.baixa
                    return (
                      <tr
                        key={`${item.tipo}-${item.id}`}
                        className="hover:bg-[#1c1e30] transition-colors cursor-pointer"
                        onClick={() => handleOpenDetalhe(item)}
                      >
                        <td className="p-3">
                          <Badge className={`text-[10px] ${item.tipo === "conciliacao" ? "bg-indigo-500/10 text-indigo-400" : "bg-sky-500/10 text-sky-400"} border-0`}>
                            {item.tipoLabel}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-white font-medium truncate max-w-[150px]">
                          {item.identificador || "-"}
                        </td>
                        <td className="p-3 text-xs text-slate-300">
                          {item.matricula || "-"}
                        </td>
                        <td className="p-3 text-xs text-slate-300 whitespace-nowrap">
                          {formatDate(item.data)}
                        </td>
                        <td className="p-3 text-xs text-slate-300">
                          {formatValor(item.valor)}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-md border ${STATUS_COLORS[item.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                            {statusLabel(item.status)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-semibold ${prioridade.color}`}>
                            {prioridade.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAbrirRegistro(item) }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2d45] transition-all"
                              title="Abrir registro"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            {item.tipo === "conciliacao" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAbrirTimeline(item) }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2d45] transition-all"
                                title="Ver na timeline"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {paginas > 1 && (
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
                  Página {page} de {paginas}
                </span>
                <Button
                  variant="ghost"
                  disabled={page >= paginas}
                  onClick={() => setPage(page + 1)}
                  className="text-xs"
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-2xl border border-[#2a2d45] bg-[#1f2136] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#2a2d45] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Detalhe da Pendência</h3>
                    <p className="text-xs text-slate-400">
                      {selectedItem.tipoLabel} — {statusLabel(selectedItem.status)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex min-h-11 min-w-11 md:h-8 md:w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#2a2d45] transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tipo</p>
                    <p className="text-sm text-white">{selectedItem.tipoLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Prioridade</p>
                    <p className={`text-sm font-semibold ${PRIORIDADE_LABELS[selectedItem.prioridade]?.color || "text-slate-300"}`}>
                      {PRIORIDADE_LABELS[selectedItem.prioridade]?.label || selectedItem.prioridade}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</p>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md border ${STATUS_COLORS[selectedItem.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                      {statusLabel(selectedItem.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Data</p>
                    <p className="text-sm text-white">{formatDate(selectedItem.data)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Identificador</p>
                    <p className="text-sm text-white">{selectedItem.identificador || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Matrícula</p>
                    <p className="text-sm text-white">{selectedItem.matricula || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Valor</p>
                    <p className="text-sm text-white">{formatValor(selectedItem.valor)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Origem</p>
                    <p className="text-sm text-white">{selectedItem.origem || "-"}</p>
                  </div>
                </div>

                {selectedItem.motivo && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Motivo</p>
                    <p className="text-sm text-slate-300 bg-[#131520] rounded-xl p-3 border border-[#2a2d45]">
                      {selectedItem.motivo}
                    </p>
                  </div>
                )}

                {selectedItem.detalhes.divergencias && Object.keys(selectedItem.detalhes.divergencias).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Divergências</p>
                    <div className="bg-[#131520] rounded-xl p-3 border border-[#2a2d45] space-y-1">
                      {Object.entries(selectedItem.detalhes.divergencias).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-slate-400">{key}</span>
                          <span className="text-slate-300">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-[#2a2d45]">
                  <Button
                    onClick={() => { handleAbrirRegistro(selectedItem); setSelectedItem(null) }}
                    className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-all gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Abrir Registro
                  </Button>
                  {selectedItem.tipo === "conciliacao" && (
                    <Button
                      onClick={() => { handleAbrirTimeline(selectedItem); setSelectedItem(null) }}
                      variant="outline"
                      className="flex-1 inline-flex h-11 items-center justify-center rounded-xl border border-[#2a2d45] bg-[#131520] text-xs font-medium text-slate-300 hover:text-white hover:bg-[#2a2d45] transition-all gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Ver Timeline
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedItem(null)}
                    variant="ghost"
                    className="h-11 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-all"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
