"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Importar Arquivo</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <p className="text-sm text-slate-600 mb-2">CSV, XLS, XLSX ou CTN</p>
          <input
            type="file"
            accept=".csv,.xls,.xlsx,.ctn"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>

        <Button type="submit" disabled={!file || loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {loading ? "Importando..." : "Importar"}
        </Button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-800">Importação Concluída</h3>
          </div>
          <div className="text-sm text-emerald-700 space-y-1">
            <p>Total de linhas no arquivo: <strong>{result.total}</strong></p>
            <p>Registros importados: <strong>{result.imported}</strong></p>
            <p>Linhas com erro: <strong>{result.errors?.length || 0}</strong></p>
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-3 text-sm text-red-600">
              <p className="font-medium">Erros encontrados:</p>
              <ul className="list-disc pl-5 mt-1">
                {result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
