"use client"

import { useState } from "react"
import { Search, User, FileText, Activity, ScanLine, ArrowRight, AlertTriangle, CheckCircle2, XCircle, Clock, Filter, X, Calendar } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { LoadingState } from "@/components/loading-state"
import { EmptyState } from "@/components/empty-state"

type TimelineEvent = {
  id: string
  tipo: string
  data: string
  resumo: string
  origem: string
  status: string | null
  valor: number | null
  link: string | null
  metadata: Record<string, any>
}

type ClienteInfo = {
  nome: string | null
  matricula: string | null
  cpf: string | null
  totalImportacoes: number
}

const TIPO_FILTERS = [
  { value: "", label: "Todos" },
  { value: "importacao", label: "Importações" },
  { value: "conciliacao", label: "Conciliações" },
  { value: "comprovante", label: "Comprovantes" },
]

const STATUS_LABEL: Record<string, string> = {
  CONCILIADO_EXATO: "Conciliado Exato",
  CONCILIADO_DOCUMENTO: "Conciliado por Documento",
  AGUARDANDO_DOCUMENTO: "Aguardando Documento",
  PENDENTE_SEM_CORRESPONDENCIA: "Pendente",
  DIVERGENCIA_VALOR: "Divergência Valor",
  DIVERGENCIA_DATA: "Divergência Data",
  DIVERGENCIA_VALOR_DATA: "Divergência Valor+Data",
  AMBIGUO_MULTIPLOS_CANDIDATOS: "Ambíguo",
  DUPLICADO: "Duplicado",
  DADOS_INSUFICIENTES: "Dados Insuficientes",
  PENDENTE_CONFERENCIA: "Pendente de Conferência",
}

const STATUS_COLOR: Record<string, string> = {
  CONCILIADO_EXATO: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  CONCILIADO_DOCUMENTO: "text-green-400 bg-green-500/10 border-green-500/30",
  AGUARDANDO_DOCUMENTO: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  PENDENTE_SEM_CORRESPONDENCIA: "text-slate-400 bg-slate-500/10 border-slate-500/30",
  DIVERGENCIA_VALOR: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  DIVERGENCIA_DATA: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  DIVERGENCIA_VALOR_DATA: "text-red-400 bg-red-500/10 border-red-500/30",
  AMBIGUO_MULTIPLOS_CANDIDATOS: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  DUPLICADO: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  DADOS_INSUFICIENTES: "text-gray-400 bg-gray-500/10 border-gray-500/30",
  PENDENTE_CONFERENCIA: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  pendente: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  aprovado: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  rejeitado: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  conferencia: "text-sky-400 bg-sky-500/10 border-sky-500/30",
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function TipoIcon({ tipo }: { tipo: string }) {
  switch (tipo) {
    case "importacao":
      return <FileText className="h-4 w-4" />
    case "conciliacao":
      return <Activity className="h-4 w-4" />
    case "comprovante":
      return <ScanLine className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const TIPO_COLORS: Record<string, string> = {
  importacao: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  conciliacao: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  comprovante: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
}

export default function TimelinePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [cliente, setCliente] = useState<ClienteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipoFilter, setTipoFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return

    setLoading(true)
    setError(null)
    setSearched(true)

    const isCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(q) || /^\d{11}$/.test(q)
    const param = isCpf ? `cpf=${encodeURIComponent(q.replace(/\D/g, ""))}` : `matricula=${encodeURIComponent(q.toUpperCase())}`

    try {
      const res = await fetch(`/api/clientes/timeline?${param}&days=365`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro ao buscar timeline" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setEvents(data.events || [])
      setCliente(data.cliente || null)
    } catch (err: any) {
      setError(err.message)
      setEvents([])
      setCliente(null)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = tipoFilter
    ? events.filter((e) => e.tipo === tipoFilter)
    : events

  return (
    <div className="min-h-screen bg-[#131520] p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Timeline do Cliente"
          description="Busque por matrícula ou CPF para visualizar o histórico completo"
        />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Matrícula ou CPF do cliente..."
              className="flex h-11 w-full rounded-xl border border-[#2a2d45] bg-[#1f2136] pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="inline-flex h-11 items-center gap-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-bold text-white transition-all shadow-md"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {/* Client Header */}
        {cliente && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-lg shadow-md">
                {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{cliente.nome || "Cliente sem nome"}</h2>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {cliente.matricula && (
                    <span className="text-xs font-medium text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-500/30">
                      Matrícula: {cliente.matricula}
                    </span>
                  )}
                  {cliente.cpf && (
                    <span className="text-xs font-medium text-slate-300 bg-slate-500/20 px-2.5 py-1 rounded-md border border-slate-500/30">
                      CPF: {cliente.cpf}
                    </span>
                  )}
                  <span className="text-xs font-medium text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30">
                    {cliente.totalImportacoes} importação(ões)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {events.length > 0 && (
          <div className="bg-[#1a1c30] rounded-xl border border-[#1e2030] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Filtros</span>
                {tipoFilter && (
                  <button onClick={() => setTipoFilter("")} className="text-[10px] text-rose-400 hover:text-rose-300 ml-1">
                    Limpar
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500">{filteredEvents.length} de {events.length} eventos</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {TIPO_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTipoFilter(f.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    tipoFilter === f.value
                      ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                      : "bg-[#131520] text-slate-400 border-[#2a2d45] hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <LoadingState variant="skeleton" rows={5} message="Buscando histórico do cliente..." />
        )}

        {/* Empty (searched but no results) */}
        {!loading && searched && events.length === 0 && !error && (
          <EmptyState
            title="Nenhum evento encontrado"
            description="Nenhum registro encontrado para a matrícula ou CPF informado no período de 365 dias."
          />
        )}

        {/* Timeline */}
        {!loading && filteredEvents.length > 0 && (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-slate-600/30 to-transparent" />
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const tipoColor = TIPO_COLORS[event.tipo] || "bg-slate-500/10 text-slate-400"
                const statusClass = event.status ? STATUS_COLOR[event.status] || "text-slate-400 bg-slate-500/10 border-slate-500/30" : ""

                return (
                  <div key={event.id} className="relative pl-14">
                    <div className={`absolute left-3.5 top-4 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full border ${tipoColor} bg-[#131520] shadow-md`}>
                      <TipoIcon tipo={event.tipo} />
                    </div>
                    <div className="bg-[#1a1c30] rounded-xl border border-[#1e2030] p-4 hover:border-[#2a2d45] transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tipoColor}`}>
                              {event.tipo === "importacao" ? "Importação" : event.tipo === "conciliacao" ? "Conciliação" : "Comprovante"}
                            </span>
                            {event.status && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusClass}`}>
                                {STATUS_LABEL[event.status] || event.status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-200">{event.resumo}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.data)}
                            </span>
                            {event.valor !== null && (
                              <span className="font-semibold text-emerald-400">
                                R$ {Number(event.valor).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-600 shrink-0 mt-1" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
