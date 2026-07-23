"use client"

import { useState, useCallback, useRef } from "react"
import { Search, User, FileText, Activity, ScanLine, ArrowRight, AlertTriangle, Clock, X, Loader2, ExternalLink } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"

type ClienteResumo = {
  id: string
  nome: string | null
  cpf: string | null
  matriculas: string[]
  totalRegistros: number
  ultimaAtividade: string
}

function formatDate(iso: string): string {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export default function CentralPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ClienteResumo[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ClienteResumo | null>(null)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (q.length < 2) return
    setLoading(true)
    setError("")
    setSelected(null)
    try {
      const res = await fetch(`/api/clientes/busca?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro na busca")
      setResults(json.clientes || [])
      if (json.clientes?.length === 0) setError("Nenhum resultado encontrado")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao buscar")
    } finally {
      setLoading(false)
    }
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  function buildUrl(path: string, matricula?: string): string {
    if (matricula) return `${path}?matricula=${encodeURIComponent(matricula)}`
    return path
  }

  return (
    <div className="min-h-screen bg-[#131520] p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Central de Atendimento"
        description="Busque clientes por matrícula, CPF, telefone, ID interno ou nome"
      />

      <div className="max-w-3xl mx-auto mt-6 space-y-6">
        <div className="relative">
          <div className="flex items-center gap-2 bg-[#1f2136] rounded-2xl border border-[#2a2d45] p-1.5 focus-within:border-indigo-500 transition-colors">
            <div className="flex items-center justify-center min-h-11 min-w-11 md:min-h-0 md:min-w-0 p-2.5 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por matrícula, CPF, telefone, ID interno ou nome..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none min-h-11 md:min-h-10"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); setSelected(null); setError(""); inputRef.current?.focus() }} className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 flex items-center justify-center p-2.5 text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
            <Button onClick={handleSearch} disabled={loading || query.trim().length < 2} className="min-h-11 md:min-h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>
        </div>

        {error && !loading && (
          <div className="flex items-center gap-3 bg-[#1f2136] rounded-2xl border border-[#2a2d45] p-6">
            <AlertTriangle className="h-5 w-5 text-slate-400 shrink-0" />
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        )}

        {results.length > 0 && !selected && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium px-1">{results.length} cliente(s) encontrado(s)</p>
            <div className="space-y-1">
              {results.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => setSelected(cliente)}
                  className="w-full flex items-center gap-4 bg-[#1f2136] hover:bg-[#2a2d45] rounded-2xl border border-[#2a2d45] p-4 transition-all text-left group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {cliente.nome || "Sem nome"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {cliente.matriculas[0] && (
                        <span className="text-xs text-indigo-400 font-mono">#{cliente.matriculas[0]}</span>
                      )}
                      {cliente.cpf && (
                        <span className="text-[10px] text-slate-500">{cliente.cpf}</span>
                      )}
                      <span className="text-[10px] text-slate-500">{cliente.totalRegistros} registro(s)</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-500">{formatDate(cliente.ultimaAtividade)}</p>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 ml-auto mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div className="bg-[#1f2136] rounded-2xl border border-[#2a2d45] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2d45]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.nome || "Cliente sem nome"}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selected.matriculas[0] && (
                      <span className="text-xs text-indigo-400 font-mono">#{selected.matriculas[0]}</span>
                    )}
                    {selected.cpf && (
                      <span className="text-[10px] text-slate-500">{selected.cpf}</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 flex items-center justify-center p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#2a2d45] transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                {selected.totalRegistros} registro(s) encontrado(s) &middot; Última atividade: {formatDate(selected.ultimaAtividade)}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ActionCard
                  icon={Clock}
                  label="Timeline"
                  description="Histórico completo"
                  href={buildUrl("/crm/clientes/timeline", selected.matriculas[0])}
                  color="text-sky-400 bg-sky-500/10"
                />
                <ActionCard
                  icon={AlertTriangle}
                  label="Pendências"
                  description="Itens pendentes"
                  href="/admin/pendencias"
                  color="text-amber-400 bg-amber-500/10"
                />
                <ActionCard
                  icon={Activity}
                  label="Conciliação"
                  description="Conciliações"
                  href="/admin/conciliacao"
                  color="text-emerald-400 bg-emerald-500/10"
                />
                <ActionCard
                  icon={ScanLine}
                  label="Comprovantes"
                  description="Documentos OCR"
                  href="/admin/conciliacao"
                  color="text-purple-400 bg-purple-500/10"
                />
                <ActionCard
                  icon={FileText}
                  label="Importações"
                  description="Arquivos importados"
                  href="/admin/importar"
                  color="text-rose-400 bg-rose-500/10"
                />
                <ActionCard
                  icon={ExternalLink}
                  label="Perfil Completo"
                  description="Visão detalhada"
                  href={buildUrl("/crm/clientes/timeline", selected.matriculas[0])}
                  color="text-indigo-400 bg-indigo-500/10"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  label,
  description,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  href: string
  color: string
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#131520] border border-[#2a2d45] hover:border-indigo-500/50 transition-all group"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">{label}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
      </div>
    </a>
  )
}
