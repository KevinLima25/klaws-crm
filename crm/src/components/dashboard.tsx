"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, DollarSign, CheckCircle, XCircle, TrendingUp } from "lucide-react"

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

export function Dashboard() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [adimplencia, setAdimplencia] = useState<Adimplencia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setVendas(data.vendasRanking || [])
        setAdimplencia(data.adimplenciaRanking || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Prospecções</TableHead>
                <TableHead className="text-right">Refiliações</TableHead>
                <TableHead className="text-right font-bold">Vendas</TableHead>
                <TableHead className="text-right">Homologados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map((v, i) => (
                <TableRow key={i} className={i === 0 ? "bg-yellow-50/50" : ""}>
                  <TableCell className="font-medium">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </TableCell>
                  <TableCell>{v.promotor_vendas}</TableCell>
                  <TableCell className="text-right">{v.prospeccoes}</TableCell>
                  <TableCell className="text-right">{v.refiliacoes}</TableCell>
                  <TableCell className="text-right font-bold">{v.vendas}</TableCell>
                  <TableCell className="text-right">{v.homologados_totais}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Ranking de Adimplência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-right">Total Gerado</TableHead>
                <TableHead className="text-right">Pagamentos</TableHead>
                <TableHead className="text-right">
                  <CheckCircle className="h-4 w-4 inline text-green-600" /> Homologados
                </TableHead>
                <TableHead className="text-right">
                  <XCircle className="h-4 w-4 inline text-red-600" /> Não Homologados
                </TableHead>
                <TableHead className="text-right">
                  <TrendingUp className="h-4 w-4 inline" /> Taxa
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adimplencia.map((a, i) => (
                <TableRow key={i} className={i === 0 ? "bg-green-50/50" : ""}>
                  <TableCell className="font-medium">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </TableCell>
                  <TableCell>{a.nome}</TableCell>
                  <TableCell className="text-right">R$ {a.total_gerado.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{a.total_pagamentos}</TableCell>
                  <TableCell className="text-right text-green-600">{a.homologados}</TableCell>
                  <TableCell className="text-right text-red-600">{a.nao_homologados}</TableCell>
                  <TableCell className="text-right font-medium">{a.taxa_homologacao}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
