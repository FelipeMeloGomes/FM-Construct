import { getDb } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, DollarSign, Clock, TrendingUp, Calendar, Construction, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardCharts } from "@/components/dashboard/charts"
import { MonthlyExportCard } from "@/components/dashboard/monthly-export-card"

export async function DashboardContent() {
  const db = await getDb()

  const [trabalhadores, dias, despesas, mesDias, mesDespesas, ultimosPagamentos, monthlyDias, monthlyDespesas, categoryChart] = await Promise.all([
    db`SELECT COUNT(*)::int as total FROM trabalhadores WHERE ativo = true`,
    db`
      SELECT
        COALESCE(SUM(valor_dia)::decimal, 0) as total_devido,
        COALESCE(SUM(COALESCE(valor_pago, 0))::decimal, 0) as total_pago,
        COALESCE(SUM(valor_dia - COALESCE(valor_pago, 0))::decimal, 0) as total_pendente
      FROM dias_trabalhados
    `,
    db`SELECT COALESCE(SUM(valor)::decimal, 0) as total FROM despesas`,
    db`
      SELECT
        COALESCE(SUM(valor_dia)::decimal, 0) as total_devido,
        COALESCE(SUM(COALESCE(valor_pago, 0))::decimal, 0) as total_pago,
        COALESCE(SUM(valor_dia - COALESCE(valor_pago, 0))::decimal, 0) as total_pendente
      FROM dias_trabalhados
      WHERE data >= date_trunc('month', CURRENT_DATE)
        AND data < date_trunc('month', CURRENT_DATE) + interval '1 month'
    `,
    db`
      SELECT COALESCE(SUM(valor)::decimal, 0) as total FROM despesas
      WHERE data >= date_trunc('month', CURRENT_DATE)
        AND data < date_trunc('month', CURRENT_DATE) + interval '1 month'
    `,
    db`
      SELECT d.*, t.nome as trabalhador_nome
      FROM dias_trabalhados d
      JOIN trabalhadores t ON t.id = d.trabalhador_id
      WHERE d.pago = true
      ORDER BY d.data_pagamento DESC NULLS LAST
      LIMIT 5
    ` as unknown as { id: string; valor_pago: number; trabalhador_nome: string }[],
    db`
      SELECT
        to_char(date_trunc('month', data), 'YYYY-MM') as mes,
        COALESCE(SUM(COALESCE(valor_pago, 0))::decimal, 0) as total_pago,
        COALESCE(SUM(valor_dia - COALESCE(valor_pago, 0))::decimal, 0) as total_pendente
      FROM dias_trabalhados
      WHERE data >= date_trunc('month', CURRENT_DATE) - interval '5 months'
      GROUP BY date_trunc('month', data)
      ORDER BY mes ASC
    ` as unknown as { mes: string; total_pago: number; total_pendente: number }[],
    db`
      SELECT
        to_char(date_trunc('month', data), 'YYYY-MM') as mes,
        COALESCE(SUM(valor)::decimal, 0) as total
      FROM despesas
      WHERE data >= date_trunc('month', CURRENT_DATE) - interval '5 months'
      GROUP BY date_trunc('month', data)
      ORDER BY mes ASC
    ` as unknown as { mes: string; total: number }[],
    db`
      SELECT categoria, COALESCE(SUM(valor)::decimal, 0) as total
      FROM despesas
      GROUP BY categoria
      ORDER BY total DESC
    ` as unknown as { categoria: string; total: number }[],
  ])

  const totalPago = Number(dias[0].total_pago)
  const totalPendente = Number(dias[0].total_pendente)
  const totalDespesas = Number(despesas[0].total)
  const trabalhadoresAtivos = Number(trabalhadores[0].total)

  const mesPago = Number(mesDias[0].total_pago)
  const mesPendente = Number(mesDias[0].total_pendente)
  const mesDespesasTotal = Number(mesDespesas[0].total)

  const temDados = trabalhadoresAtivos > 0 || totalDespesas > 0 || totalPago > 0 || totalPendente > 0
  const temMes = mesPago > 0 || mesPendente > 0 || mesDespesasTotal > 0
  const nomeMes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
  const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)

  if (!temDados) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-amber-600/10 ring-1 ring-primary/10">
          <Construction className="size-10 text-primary" />
        </div>
        <h2 className="font-[family-name:var(--font-sora)] text-xl font-semibold text-foreground">Bem-vindo ao FM-Construct</h2>
        <p className="text-sm mt-2 text-center max-w-sm text-muted-foreground">
          Nenhum dado cadastrado ainda. Comece adicionando trabalhadores e despesas para acompanhar a obra.
        </p>
        <div className="flex gap-3 mt-8">
          <Link href="/trabalhadores/novo">
            <Button className="btn-glow cursor-pointer">Cadastrar Trabalhador</Button>
          </Link>
          <Link href="/despesas/nova">
            <Button variant="outline" className="cursor-pointer">Registrar Despesa</Button>
          </Link>
        </div>
      </div>
    )
  }

  const cards = [
    {
      title: "Trabalhadores Ativos",
      value: trabalhadoresAtivos,
      icon: HardHat,
      href: "/trabalhadores",
    },
    {
      title: "Total Pago",
      value: formatCurrency(totalPago),
      icon: DollarSign,
      href: "/trabalhadores",
    },
    {
      title: "Total Pendente",
      value: formatCurrency(totalPendente),
      icon: Clock,
      href: "/trabalhadores",
    },
    {
      title: "Total Despesas",
      value: formatCurrency(totalDespesas),
      icon: TrendingUp,
      href: "/despesas",
    },
  ]

  const custoTotal = totalPago + totalDespesas

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href} className="animate-fade-in-up delay-1">
              <Card className="card-hover group cursor-pointer border-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className="size-5 text-primary/60 transition-transform duration-300 group-hover:scale-110" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground/40 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {custoTotal > 0 && (
        <Link href="/relatorios" className="animate-fade-in-up delay-2 block">
          <Card className="card-hover group cursor-pointer border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total da Obra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-primary">{formatCurrency(custoTotal)}</div>
              <p className="text-xs text-muted-foreground/70 mt-1.5">
                {formatCurrency(totalPago)} pago em trabalhadores + {formatCurrency(totalDespesas)} em despesas
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      {temMes && (
        <MonthlyExportCard
          nomeMes={nomeMesCapitalizado}
          pago={formatCurrency(mesPago)}
          pendente={formatCurrency(mesPendente)}
          despesas={formatCurrency(mesDespesasTotal)}
        />
      )}

      {ultimosPagamentos.length > 0 && (
        <div className="animate-fade-in-up delay-4">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">&Uacute;ltimos Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/50">
                {ultimosPagamentos.map((p, i: number) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-500">
                        {p.trabalhador_nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{p.trabalhador_nome}</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-500">
                      {formatCurrency(Number(p.valor_pago))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DashboardCharts
        monthlyData={(() => {
            const despesasMap = new Map(
              (monthlyDespesas as { mes: string; total: number }[]).map((d) => [d.mes, Number(d.total)])
            )
            return (monthlyDias as { mes: string; total_pago: number; total_pendente: number }[]).map((d) => ({
              mes: d.mes,
              total_pago: Number(d.total_pago),
              total_pendente: Number(d.total_pendente),
              total_despesas: despesasMap.get(d.mes) ?? 0,
            }))
          })()}
        categoryData={categoryChart as { categoria: string; total: number }[]}
      />
    </div>
  )
}
