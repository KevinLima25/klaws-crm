"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { LoadingState } from "@/components/loading-state"

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError("")
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/importar", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || "Erro ao importar")
        if (data.errors?.length) setError(error + " - " + data.errors.join("; "))
      }
    } catch {
      setError("Erro de conexão com o servidor")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131520] p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <PageHeader title="Importar Arquivo" description="CSV, XLS, XLSX ou CTN - processamento em andamento" />
          <LoadingState variant="skeleton" rows={3} message="Importando..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#131520] p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="Importar Arquivo" description="Faça upload de arquivos CSV, XLS, XLSX ou CTN para processamento" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-[#2a2d45] rounded-2xl p-8 text-center bg-[#1a1c30] hover:border-indigo-500/40 transition-colors">
            <FileText className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <p className="text-sm text-slate-400 mb-2">Arraste o arquivo ou clique para selecionar</p>
            <p className="text-xs text-slate-500 mb-4">Formatos aceitos: CSV, XLS, XLSX, CTN</p>
            <input
              type="file"
              accept=".csv,.xls,.xlsx,.ctn"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 file:transition-all file:cursor-pointer"
            />
          </div>

          <Button type="submit" disabled={!file || loading} className="w-full h-11 rounded-xl text-sm font-bold">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {loading ? "Importando..." : "Importar"}
          </Button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-emerald-300">Importação Concluída</h3>
            </div>
            <div className="text-sm text-emerald-200 space-y-1">
              <p>Total de linhas no arquivo: <strong>{result.total}</strong></p>
              <p>Registros importados: <strong>{result.imported}</strong></p>
              <p>Linhas com erro: <strong>{result.errors?.length || 0}</strong></p>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-3 text-sm text-rose-300">
                <p className="font-medium">Erros encontrados:</p>
                <ul className="list-disc pl-5 mt-1">
                  {result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
