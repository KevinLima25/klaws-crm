"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, DollarSign, CheckCircle, XCircle, TrendingUp, Medal, Target, Users, Star, User, Percent, ArrowUpRight, ShieldCheck, Activity, BarChart3 } from "lucide-react"

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
  if (!c) return true // padrão para gestores ou desenvolvimento
  if (c.includes("COBRANCA") || c.includes("COBRANÇA")) {
    // Se for estritamente cobrança sem ser gerente, não vê vendas
    return c.includes("GERENTE") || c.includes("ADMIN") || c.includes("ASSISTENTE")
  }
  return c.includes("VENDEDOR") || c.includes("COORDENADOR") || c.includes("LIDER") || c.includes("LÍDER") || c.includes("GERENTE") || c.includes("ASSISTENTE") || c.includes("ADMIN") || c.includes("PROMOTOR")
}

function canSeeAdimplencia(cargo: string) {
  const c = cargo?.toUpperCase() || ""
  if (!c) return true
  if (c.includes("VENDEDOR") || c.includes("PROMOTOR")) {
    // Se for estritamente vendedor, não vê adimplência financeira detalhada
    return c.includes("GERENTE") || c.includes("ADMIN") || c.includes("ASSISTENTE")
  }
  return c.includes("COBRANCA") || c.includes("COBRANÇA") || c.includes("GERENTE") || c.includes("ASSISTENTE") || c.includes("ADMIN") || c.includes("FINANCEIRO")
}

function isManagerRole(cargo: string) {
  const c = cargo?.toUpperCase() || ""
  return c.includes("GERENTE") || c.includes("ASSISTENTE") || c.includes("ADMIN") || c.includes("COORDENADOR") || c.includes("DIRETOR") || !c
}

function isCobrancaRole(cargo: string) {
  const c = cargo?.toUpperCase() || ""
  return (c.includes("COBRANCA") || c.includes("COBRANÇA") || c.includes("FINANCEIRO")) && !isManagerRole(cargo)
}

function isVendedorRole(cargo: string) {
  const c = cargo?.toUpperCase() || ""
  return (c.includes("VENDEDOR") || c.includes("PROMOTOR") || c.includes("LIDER") || c.includes("LÍDER")) && !isManagerRole(cargo)
}

export function DashboardV2() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [adimplencia, setAdimplencia] = useState<Adimplencia[]>([])
  const [totais, setTotais] = useState<Totais>({ totalVendas: 0, totalHomologados: 0, totalAdimp: 0 })
  const [userName, setUserName] = useState("")
  const [userCargo, setUserCargo] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeRanking, setActiveRanking] = useState<"vendas" | "adimplencia">("vendas")

  useEffect(() => {
    const supabase = createClient()

    Promise.all([
      fetch("/api/dashboard").then((r) => {
        if (!r.ok) throw new Error("dashboard " + r.status)
        return r.json()
      }),
      supabase.auth.getUser().then(async ({ data }) => {
        const u = data.user
        if (!u) return { name: "", cargo: "" }

        let name = u.user_metadata?.name || u.email?.split("@")[0] || ""
        let cargo = u.user_metadata?.cargo || ""

        const res = await fetch("/api/me?userId=" + u.id)
        if (res.ok) {
          const me = await res.json()
          if (me.name) name = me.name
          if (me.cargo) cargo = me.cargo
        }
        return { name, cargo }
      }),
    ])
      .then(([dashboard, userProfile]) => {
        setVendas(dashboard.vendasRanking || [])
        setAdimplencia(dashboard.adimplenciaRanking || [])
        if (dashboard.totais) setTotais(dashboard.totais)

        setUserName(userProfile.name)
        setUserCargo(userProfile.cargo)

        if (isCobrancaRole(userProfile.cargo)) {
          setActiveRanking("adimplencia")
        } else if (canSeeVendas(userProfile.cargo)) {
          setActiveRanking("vendas")
        } else if (canSeeAdimplencia(userProfile.cargo)) {
          setActiveRanking("adimplencia")
        }
      })
      .catch((err) => console.error("Dashboard error:", err))
      .finally(() => setLoading(false))
  }, [])

  const acessoVendas = canSeeVendas(userCargo)
  const acessoAdimp = canSeeAdimplencia(userCargo)
  const isManager = isManagerRole(userCargo)
  const isCobranca = isCobrancaRole(userCargo)
  const isVendedor = isVendedorRole(userCargo)

  // Encontrar o desempenho pessoal do usuário logado no ranking
  const normalizedUserName = userName.trim().toLowerCase()
  const minhaVendaIndex = vendas.findIndex(
    (v) => v.promotor_vendas.trim().toLowerCase() === normalizedUserName || normalizedUserName.includes(v.promotor_vendas.trim().toLowerCase())
  )
  const minhaVenda = minhaVendaIndex !== -1 ? vendas[minhaVendaIndex] : null

  const minhaAdimpIndex = adimplencia.findIndex(
    (a) => a.nome.trim().toLowerCase() === normalizedUserName || normalizedUserName.includes(a.nome.trim().toLowerCase())
  )
  const minhaAdimp = minhaAdimpIndex !== -1 ? adimplencia[minhaAdimpIndex] : null

  const ranking = activeRanking === "vendas" ? vendas : adimplencia
  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  // Cálculos de adimplência agregados para a visão da cobrança
  const totalPagamentosCobrança = adimplencia.reduce((acc, curr) => acc + curr.total_pagamentos, 0)
  const totalHomologadosCobrança = adimplencia.reduce((acc, curr) => acc + curr.homologados, 0)
  const totalNaoHomologadosCobrança = adimplencia.reduce((acc, curr) => acc + curr.nao_homologados, 0)
  const taxaHomologacaoGeral =
    totalPagamentosCobrança > 0 ? ((totalHomologadosCobrança / totalPagamentosCobrança) * 100).toFixed(1) + "%" : "0%"

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8f9fc]">
        <div className="text-sm text-slate-400 font-medium animate-pulse">Carregando indicadores do dashboard...</div>
      </div>
    )

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fc] font-sans">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Banner de Boas-Vindas Dinâmico Adaptado por Cargo */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-500/30">
                {userCargo || "Visão Geral"}
              </span>
              {isManager && (
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30">
                  Gestão Executiva
                </span>
              )}
              {isCobranca && (
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  Financeiro & Cobrança
                </span>
              )}
              {isVendedor && (
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/20 px-2.5 py-1 rounded-md border border-sky-500/30">
                  Equipe de Vendas
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-white">
              Olá, {userName || "Colaborador"}! 👋
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              {isManager
                ? "Painel executivo 360°: desempenho comercial, conciliação e indicadores financeiros da equipe."
                : isCobranca
                ? "Painel de controle financeiro: monitore baixas efetuadas, total gerado e homologações de pagamentos."
                : "Seu painel comercial: acompanhe seu desempenho individual e as metas da sua equipe."}
            </p>
          </div>

          {/* Card Resumido de Perfil */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-sm">
              {userName ? getInitials(userName) : <User className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white truncate max-w-[150px]">{userName || "Usuário"}</p>
              <p className="text-[10px] text-indigo-300 truncate max-w-[150px]">{userCargo || "Membro da Equipe"}</p>
            </div>
          </div>
        </div>

        {/* 1. MÓDULO DE DESEMPENHO PESSOAL DO COLABORADOR (Vendedor ou Cobrança) */}
        {(minhaVenda || minhaAdimp) && (
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-4 border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Trophy className="w-64 h-64 text-white" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Seu Desempenho Individual</h2>
                  <p className="text-xs text-indigo-200">Métricas pessoais sincronizadas diretamente da base oficial</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {minhaVendaIndex !== -1 && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                    <Trophy className="h-4 w-4" /> #{minhaVendaIndex + 1}º no Ranking de Vendas
                  </span>
                )}
                {minhaAdimpIndex !== -1 && (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" /> #{minhaAdimpIndex + 1}º no Ranking de Cobrança
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 pt-2">
              {minhaVenda && (
                <>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">Suas Vendas</p>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">{minhaVenda.vendas}</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      {totais.totalVendas > 0
                        ? `${((minhaVenda.vendas / totais.totalVendas) * 100).toFixed(1)}% do total da equipe`
                        : "Sem vendas"}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">Homologados</p>
                    <p className="text-2xl font-extrabold text-sky-400 mt-1">{minhaVenda.homologados_totais}</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      {minhaVenda.vendas > 0
                        ? `${((minhaVenda.homologados_totais / minhaVenda.vendas) * 100).toFixed(1)}% conversão`
                        : "0% conversão"}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">Prospecções</p>
                    <p className="text-2xl font-extrabold text-indigo-200 mt-1">{minhaVenda.prospeccoes}</p>
                    <p className="text-[10px] text-slate-300 mt-1">Novos contatos</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">Refiliações</p>
                    <p className="text-2xl font-extrabold text-purple-300 mt-1">{minhaVenda.refiliacoes}</p>
                    <p className="text-[10px] text-slate-300 mt-1">Clientes reativados</p>
                  </div>
                </>
              )}

              {minhaAdimp && (
                <>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Seu Total Gerado</p>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">R$ {minhaAdimp.total_gerado.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Baixas Efetuadas</p>
                    <p className="text-2xl font-extrabold text-amber-300 mt-1">{minhaAdimp.total_pagamentos}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Homologados OK</p>
                    <p className="text-2xl font-extrabold text-sky-400 mt-1">{minhaAdimp.homologados}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Taxa de Homologação</p>
                    <p className="text-2xl font-extrabold text-emerald-300 mt-1">{minhaAdimp.taxa_homologacao}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 2. VISÃO EXCLUSIVA DE COBRANÇA / FINANCEIRO */}
        {isCobranca && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Baixado Geral</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1.5">R$ {totais.totalAdimp.toFixed(2)}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="h-3.5 w-3.5" />
                  <span>{adimplencia.length} colaboradores na operação</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pagamentos Processados</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1.5">{totalPagamentosCobrança}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{totalHomologadosCobrança} homologados com sucesso</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxa de Homologação</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1.5">{taxaHomologacaoGeral}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Percent className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>Índice global de aprovação bancária</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendentes / Não Homolog.</p>
                    <p className="text-2xl font-bold text-red-500 mt-1.5">{totalNaoHomologadosCobrança}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                    <XCircle className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Requer verificação manual ou refiliação</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CARDS DE RESUMO GERAL DA EQUIPE (Para Gestão ou Vendedores) */}
        {!isCobranca && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {acessoVendas && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Vendas (Equipe)</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1.5">{totais.totalVendas}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <Target className="h-3.5 w-3.5" />
                  <span>{vendas.length} vendedores ativos na base</span>
                </div>
              </div>
            )}

            {acessoVendas && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Homologados Totais</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1.5">{totais.totalHomologados}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {totais.totalVendas > 0 ? ((totais.totalHomologados / totais.totalVendas) * 100).toFixed(1) : 0}% de aprovação
                    geral
                  </span>
                </div>
              </div>
            )}

            {acessoAdimp && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Adimplência Total</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1.5">R$ {totais.totalAdimp.toFixed(0)}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <Medal className="h-3.5 w-3.5" />
                  <span>{adimplencia.length} colaboradores na baixa</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. SELETOR DE ABAS DE RANKING (Para Gestores ou com Múltiplas Permissões) */}
        {isManager && (
          <div className="flex gap-4 border-b border-slate-200 pb-1">
            {acessoVendas && (
              <button
                onClick={() => setActiveRanking("vendas")}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeRanking === "vendas"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Trophy className="h-4 w-4" />
                Ranking da Equipe de Vendas
                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  {vendas.length}
                </span>
              </button>
            )}

            {acessoAdimp && (
              <button
                onClick={() => setActiveRanking("adimplencia")}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeRanking === "adimplencia"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Ranking de Adimplência & Baixas
                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                  {adimplencia.length}
                </span>
              </button>
            )}
          </div>
        )}

        {/* TÍTULO SEÇÃO RANKING QUANDO NÃO FOR MANAGER */}
        {!isManager && (
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {activeRanking === "vendas" ? (
                <>
                  <Trophy className="h-5 w-5 text-amber-500" /> Ranking Oficial de Vendas da Equipe
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5 text-emerald-500" /> Ranking de Baixas e Conciliação Financeira
                </>
              )}
            </h2>
          </div>
        )}

        {/* 5. TOP 3 PÓDIO DESTACADO */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {top3.map((item, i) => {
              const nome = activeRanking === "vendas" ? (item as Venda).promotor_vendas : (item as Adimplencia).nome
              const isCurrent = nome.trim().toLowerCase() === normalizedUserName
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"
              const valor =
                activeRanking === "vendas"
                  ? `${(item as Venda).vendas} vendas`
                  : `R$ ${(item as Adimplencia).total_gerado.toFixed(2)}`
              const sub =
                activeRanking === "vendas"
                  ? `${(item as Venda).homologados_totais} homologados`
                  : `${(item as Adimplencia).taxa_homologacao} taxa`
              const badgeColor =
                i === 0
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : i === 1
                  ? "bg-slate-50 text-slate-500 border-slate-200"
                  : "bg-orange-50 text-orange-600 border-orange-200"

              return (
                <div
                  key={i}
                  className={`relative bg-white rounded-xl border-2 p-6 shadow-sm transition-all hover:shadow-md ${
                    isCurrent ? "ring-2 ring-indigo-500 ring-offset-2" : ""
                  } ${i === 0 ? "border-amber-300 shadow-amber-100" : i === 1 ? "border-slate-200" : "border-orange-200"}`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      Você
                    </span>
                  )}

                  <div className="flex flex-col items-center text-center gap-3">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr ${getGradient(
                        i
                      )} text-white shadow-md text-lg font-bold`}
                    >
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

        {/* 6. TABELA COMPLETA COM OS DEMAIS INTEGRANTES */}
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
                  const isCurrent = nome.trim().toLowerCase() === normalizedUserName
                  return (
                    <TableRow key={idx} className={`group ${isCurrent ? "bg-indigo-50/70 font-semibold" : "hover:bg-slate-50/50"}`}>
                      <TableCell className="font-medium text-sm text-slate-400">{i + 1}</TableCell>
                      <TableCell>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr ${getGradient(
                            i
                          )} text-white text-xs font-bold shadow-sm`}
                        >
                          {getInitials(nome)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-700">
                        {nome}{" "}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                            Você
                          </span>
                        )}
                      </TableCell>
                      {activeRanking === "vendas" ? (
                        <>
                          <TableCell className="text-right text-sm text-slate-500">{(item as Venda).prospeccoes}</TableCell>
                          <TableCell className="text-right text-sm text-slate-500">{(item as Venda).refiliacoes}</TableCell>
                          <TableCell className="text-right text-sm font-bold text-emerald-600">{(item as Venda).vendas}</TableCell>
                          <TableCell className="text-right text-sm text-slate-500">{(item as Venda).homologados_totais}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right text-sm font-medium text-slate-700">
                            R$ {(item as Adimplencia).total_gerado.toFixed(2)}
                          </TableCell>
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
