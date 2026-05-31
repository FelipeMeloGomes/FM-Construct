import { getDb } from "@/lib/db"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Relatórios",
}

import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, File, Table } from "lucide-react"
import { FiltroMes } from "./filtro-mes"
import { DirectionalTransition } from "@/components/layout/directional-transition"

export default async function RelatoriosPage(props: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await props.searchParams
  const db = await getDb()

  const mesFiltro = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : null

  const filtroDias = mesFiltro
    ? db`
      SELECT
        COUNT(DISTINCT t.id) as total_trabalhadores,
        COALESCE(SUM(d.valor_dia)::decimal, 0) as total_devido,
        COALESCE(SUM(CASE WHEN d.pago THEN d.valor_pago ELSE 0 END)::decimal, 0) as total_pago,
        COALESCE(SUM(CASE WHEN NOT d.pago THEN d.valor_dia ELSE 0 END)::decimal, 0) as total_pendente
      FROM trabalhadores t
      LEFT JOIN dias_trabalhados d ON d.trabalhador_id = t.id
        AND d.data >= ${mesFiltro + "-01"}::date
        AND d.data < (${mesFiltro + "-01"}::date + interval '1 month')
      WHERE t.ativo = true
    `
    : db`
      SELECT
        COUNT(DISTINCT t.id) as total_trabalhadores,
        COALESCE(SUM(d.valor_dia)::decimal, 0) as total_devido,
        COALESCE(SUM(CASE WHEN d.pago THEN d.valor_pago ELSE 0 END)::decimal, 0) as total_pago,
        COALESCE(SUM(CASE WHEN NOT d.pago THEN d.valor_dia ELSE 0 END)::decimal, 0) as total_pendente
      FROM trabalhadores t
      LEFT JOIN dias_trabalhados d ON d.trabalhador_id = t.id
      WHERE t.ativo = true
    `

  const filtroDespesas = mesFiltro
    ? db`
      SELECT
        COALESCE(SUM(valor)::decimal, 0) as total_despesas,
        COUNT(*) as qtd_despesas
      FROM despesas
      WHERE data >= ${mesFiltro + "-01"}::date
        AND data < (${mesFiltro + "-01"}::date + interval '1 month')
    `
    : db`
      SELECT
        COALESCE(SUM(valor)::decimal, 0) as total_despesas,
        COUNT(*) as qtd_despesas
      FROM despesas
    `

  const [resumoTrabalhadores, resumoDespesas] = await Promise.all([filtroDias, filtroDespesas])

  const r = resumoTrabalhadores[0] as unknown as { total_trabalhadores: number; total_devido: number; total_pago: number; total_pendente: number }
  const d = resumoDespesas[0] as unknown as { total_despesas: number; qtd_despesas: number }

  const exportParams = mesFiltro ? `&mes=${mesFiltro}` : ""

  const anyData = (await db`
    SELECT
      EXISTS (SELECT 1 FROM trabalhadores) as has_trabalhadores,
      EXISTS (SELECT 1 FROM despesas) as has_despesas
  `)[0] as unknown as { has_trabalhadores: boolean; has_despesas: boolean }

  return (
    <DirectionalTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-400">Relatórios</h1>
        <p className="text-sm text-slate-400 mt-1">Exporte os dados da obra</p>
      </div>

      {!anyData.has_trabalhadores && !anyData.has_despesas ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <FileText className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhum dado cadastrado</p>
          <p className="text-sm mt-1">Adicione trabalhadores ou despesas para gerar relatórios</p>
        </div>
      ) : (
      <>

      <FiltroMes mesAtual={mesFiltro ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-400">
            {mesFiltro
              ? `Resumo — ${new Date(mesFiltro + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}`
              : "Resumo Geral"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Total Trabalhadores</p>
            <p className="text-lg font-bold">{r.total_trabalhadores}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Devido</p>
            <p className="text-lg font-bold text-amber-400">{formatCurrency(Number(r.total_devido))}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Pago</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(Number(r.total_pago))}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Despesas</p>
            <p className="text-lg font-bold text-blue-400">{formatCurrency(Number(d.total_despesas))}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trabalhadores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">
              Relatório completo com todos os trabalhadores, dias trabalhados, valores devidos e pagamentos.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/export?type=trabalhadores&format=pdf${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </a>
              <a href={`/api/export?type=trabalhadores&format=txt${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <File className="h-4 w-4 mr-2" />
                  TXT
                </Button>
              </a>
              <a href={`/api/export?type=trabalhadores&format=csv${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <Table className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">
              Relatório completo com todas as despesas categorizadas por tipo.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/export?type=despesas&format=pdf${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </a>
              <a href={`/api/export?type=despesas&format=txt${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <File className="h-4 w-4 mr-2" />
                  TXT
                </Button>
              </a>
              <a href={`/api/export?type=despesas&format=csv${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <Table className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle>Relatório Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">
              Relatório completo da obra incluindo trabalhadores, pagamentos e despesas em um único arquivo.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/export?type=geral&format=pdf${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button className="cursor-pointer w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Completo
                </Button>
              </a>
              <a href={`/api/export?type=geral&format=txt${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <File className="h-4 w-4 mr-2" />
                  TXT Completo
                </Button>
              </a>
              <a href={`/api/export?type=geral&format=csv${exportParams}`} target="_blank"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="cursor-pointer w-full sm:w-auto">
                  <Table className="h-4 w-4 mr-2" />
                  CSV Completo
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
    </DirectionalTransition>
  )
}
