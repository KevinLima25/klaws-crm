"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, DollarSign, CheckCircle, XCircle, TrendingUp, Medal, Target, Users, ShieldAlert } from "lucide-react"

type Venda = {
  promotor_vendas: string
  vendas: number
  prospeccoes: number
  refiliacoes: number
  homologados_totais: number
}

type Adimplencia = {
  nome: string
  total_gerado: number
  total_pagamentos: number
  homologados: number
  nao_homologados: number
  taxa_homologacao: string
}

type Totais = {
  totalVendas: number
  totalHomologados: number
  totalAdimp: number
}

const gradients = [
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-cyan-400 to-teal-500",
  "from-fuchsia-400 to-pink-500",
  "from-lime-400 to-green-500",
  "from-indigo-400 to-violet-500",
  "from-red-400 to-rose-500",
]

function getGradient(index: number) {
  return gradients[index % gradients.length]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function canSeeVendas(cargo: string) {
  const c = cargo?.toUpperCase() || ""
  return c.includes("VENDEDOR") || c.includes("COORDENADOR") || c.includes("LIDER DE VENDAS") || c.includes("LÍDER DE VENDAS") || c.includes("GERENTE") || c.includes("ASSISTENTE FINANCEIRO")
}

function canSeeAdimplencia(cargo: string) {
  const c = cargo?.toUpperCase() || ""
  return c.includes("COBRANCA") || c.includes("COBRANÇA") || c.includes("GERENTE") || c.includes("ASSISTENTE FINANCEIRO")
}

export function DashboardV2() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [adimplencia, setAdimplencia] = useState<Adimplencia[]>([])
  const [totais, setTotais] = useState<Totais>({ totalVendas: 0, totalHomologados: 0, totalAdimp: 0 })
  const [userCargo, setUserCargo] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeRanking, setActiveRanking] = useState<"vendas" | "adimplencia">("vendas")

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => {
        if (!r.ok) throw new Error("dashboard " + r.status)
        return r.json()
      }),
      fetch("/api/me").then((r) => {
        if (!r.ok) return { cargo: "" }
        return r.json()
      }),
    ])
      .then(([dashboard, me]) => {
        setVendas(dashboard.vendasRanking || [])
        setAdimplencia(dashboard.adimplenciaRanking || [])
        if (dashboard.totais) setTotais(dashboard.totais)
        const cargo = me.cargo || ""
        setUserCargo(cargo)
        if (canSeeVendas(cargo)) setActiveRanking("vendas")
        else if (canSeeAdimplencia(cargo)) setActiveRanking("adimplencia")
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const acessoVendas = canSeeVendas(userCargo)
  const acessoAdimp = canSeeAdimplencia(userCargo)
  const ranking = activeRanking === "vendas" ? vendas : adimplencia
  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#f8f9fc]">
      <div className="text-sm text-slate-400 font-medium">Carregando dashboard...</div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fc] font-sans">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Acompanhe os indicadores da sua equipe</p>
          </div>
          {userCargo && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
              <ShieldAlert className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium text-slate-600">{userCargo}</span>
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {acessoVendas && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Vendas</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1.5">{totais.totalVendas}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Target className="h-3.5 w-3.5" />
                <span>{vendas.length} vendedores ativos</span>
              </div>
            </div>
          )}

          {acessoVendas && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Homologados</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1.5">{totais.totalHomologados}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Users className="h-3.5 w-3.5" />
                <span>{totais.totalVendas > 0 ? ((totais.totalHomologados / totais.totalVendas) * 100).toFixed(1) : 0}% de aprovação</span>
              </div>
            </div>
          )}

          {acessoAdimp && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Adimplência</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1.5">R$ {totais.totalAdimp.toFixed(0)}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Medal className="h-3.5 w-3.5" />
                <span>{adimplencia.length} colaboradores</span>
              </div>
            </div>
          )}
        </div>

        {/* Alternador de Abas */}
        <div className="flex gap-4 border-b border-slate-200">
          {acessoVendas && (
            <button
              onClick={() => setActiveRanking("vendas")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeRanking === "vendas"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Trophy className="h-4 w-4 inline mr-1.5" />
              Ranking de Vendas
            </button>
          )}
          {acessoAdimp && (
            <button
              onClick={() => setActiveRanking("adimplencia")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeRanking === "adimplencia"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-1.5" />
              Ranking de Adimplência
            </button>
          )}
        </div>

        {/* Top 3 Destacado */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {top3.map((item, i) => {
              const nome = activeRanking === "vendas" ? (item as Venda).promotor_vendas : (item as Adimplencia).nome
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"
              const valor = activeRanking === "vendas"
                ? `${(item as Venda).vendas} vendas`
                : `R$ ${(item as Adimplencia).total_gerado.toFixed(2)}`
              const sub = activeRanking === "vendas"
                ? `${(item as Venda).homologados_totais} homologados`
                : `${(item as Adimplencia).taxa_homologacao} taxa`
              const badgeColor = i === 0
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : i === 1
                ? "bg-slate-50 text-slate-500 border-slate-200"
                : "bg-orange-50 text-orange-600 border-orange-200"

              return (
                <div
                  key={i}
                  className={`relative bg-white rounded-xl border-2 p-6 shadow-sm transition-all hover:shadow-md ${
                    i === 0 ? "border-amber-300 shadow-amber-100" : i === 1 ? "border-slate-200" : "border-orange-200"
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr ${getGradient(i)} text-white shadow-md text-lg font-bold`}>
                      {getInitials(nome)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800">{nome}</p>
                      <p className="text-2xl font-extrabold text-emerald-600 mt-1">{valor}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${badgeColor}`}>
                      {medal} {i === 0 ? "1º Lugar" : i === 1 ? "2º Lugar" : "3º Lugar"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tabela com os demais */}
        {rest.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="w-12 text-xs font-semibold text-slate-400">#</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400">Foto</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-400">
                    {activeRanking === "vendas" ? "Vendedor" : "Usuário"}
                  </TableHead>
                  {activeRanking === "vendas" ? (
                    <>
                      <TableHead className="text-right text-xs font-semibold text-slate-400">Prospecções</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-400">Refiliações</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-800">Vendas</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-400">Homologados</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-right text-xs font-semibold text-slate-400">Total Gerado</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-400">Pagamentos</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-400">
                        <CheckCircle className="h-3.5 w-3.5 inline text-emerald-500" /> OK
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-400">
                        <XCircle className="h-3.5 w-3.5 inline text-red-400" /> Nok
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-400">Taxa</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rest.map((item, idx) => {
                  const i = idx + 3
                  const nome = activeRanking === "vendas" ? (item as Venda).promotor_vendas : (item as Adimplencia).nome
                  return (
                    <TableRow key={idx} className="group hover:bg-slate-50/50">
                      <TableCell className="font-medium text-sm text-slate-400">{i + 1}</TableCell>
                      <TableCell>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr ${getGradient(i)} text-white text-xs font-bold shadow-sm`}>
                          {getInitials(nome)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-700">{nome}</TableCell>
                      {activeRanking === "vendas" ? (
                        <>
                          <TableCell className="text-right text-sm text-slate-500">{(item as Venda).prospeccoes}</TableCell>
                          <TableCell className="text-right text-sm text-slate-500">{(item as Venda).refiliacoes}</TableCell>
                          <TableCell className="text-right text-sm font-bold text-emerald-600">{(item as Venda).vendas}</TableCell>
                          <TableCell className="text-right text-sm text-slate-500">{(item as Venda).homologados_totais}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right text-sm font-medium text-slate-700">R$ {(item as Adimplencia).total_gerado.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm text-slate-500">{(item as Adimplencia).total_pagamentos}</TableCell>
                          <TableCell className="text-right text-sm text-emerald-600 font-medium">{(item as Adimplencia).homologados}</TableCell>
                          <TableCell className="text-right text-sm text-red-500">{(item as Adimplencia).nao_homologados}</TableCell>
                          <TableCell className="text-right text-sm font-semibold">{(item as Adimplencia).taxa_homologacao}</TableCell>
                        </>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
