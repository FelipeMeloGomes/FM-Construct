"use client"

import { useRef, useMemo, useState, useCallback, useSyncExternalStore, memo } from "react"
import dynamic from "next/dynamic"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, type ChartOptions } from "chart.js"
import { useTheme } from "@/components/theme/theme-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChart, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), { ssr: false })
const Doughnut = dynamic(() => import("react-chartjs-2").then((m) => m.Doughnut), { ssr: false })

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface MonthlyData {
  mes: string
  total_pago: number
  total_pendente: number
  total_despesas: number
}

interface CategoryData {
  categoria: string
  total: number
}

const CATEGORY_LABELS: Record<string, string> = {
  material: "Material",
  alimentacao: "Alimentação",
  transporte: "Transporte",
  ferramentas: "Ferramentas",
  outros: "Outros",
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
}

type Period = 3 | 6 | 12

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 3, label: "3m" },
  { value: 6, label: "6m" },
  { value: 12, label: "12m" },
]

const CATEGORY_COLORS: Record<string, string> = {
  material: "#f59e0b",
  alimentacao: "#10b981",
  transporte: "#8b5cf6",
  ferramentas: "#06b6d4",
  outros: "#64748b",
}

function formatMonthLabel(ym: string): string {
  return MONTH_LABELS[ym.split("-")[1]] || ym
}

function readCSSVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function applyAlpha(color: string, alpha: number): string {
  if (color.startsWith("oklch(")) {
    return color.replace(")", ` / ${alpha})`)
  }
  if (color.startsWith("#") && color.length === 7) {
    return color + Math.round(alpha * 255).toString(16).padStart(2, "0")
  }
  return color
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatShortCurrency(value: number): string {
  if (value >= 1000) return `R$${(value / 1000).toFixed(1).replace(".", ",")}k`
  return `R$${Math.round(value)}`
}

function getMonths(count: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return months
}

// (value labels removed — tooltip + mini table provide numerical data)

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground/60 hidden sm:inline">Período</span>
      <div className="flex gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5" role="radiogroup" aria-label="Selecionar período">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            role="radio"
            aria-checked={value === opt.value}
            aria-label={`Últimos ${opt.value} meses`}
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
              value === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message, actions }: { icon: React.ElementType; message: string; actions?: React.ReactNode }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Icon className="size-8 text-muted-foreground/40 animate-pulse" />
      <p>{message}</p>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

function MonthlyTable({ rows, onRowClick }: { rows: { mes: string; label: string; pago: number; pendente: number; despesas: number; total: number }[]; onRowClick: (mes: string) => void }) {
  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="grid grid-cols-5 gap-px rounded-lg overflow-hidden text-[11px]">
        <div className="bg-muted/50 px-2 py-1 font-medium text-muted-foreground">Mês</div>
        <div className="bg-muted/50 px-2 py-1 font-medium text-right text-muted-foreground">Pago</div>
        <div className="bg-muted/50 px-2 py-1 font-medium text-right text-muted-foreground">Pendente</div>
        <div className="bg-muted/50 px-2 py-1 font-medium text-right text-muted-foreground">Despesas</div>
        <div className="bg-muted/50 px-2 py-1 font-medium text-right text-muted-foreground">Total</div>
        {rows.slice().reverse().map((row) => (
          <button
            key={row.mes}
            onClick={() => onRowClick(row.mes)}
            className="contents cursor-pointer group"
          >
            <div className="bg-card px-2 py-1 text-foreground group-hover:bg-muted/30 transition-colors">{row.label}</div>
            <div className="bg-card px-2 py-1 text-right font-medium tabular-nums text-primary group-hover:bg-muted/30 transition-colors">
              {formatShortCurrency(row.pago)}
            </div>
            <div className="bg-card px-2 py-1 text-right font-medium tabular-nums text-destructive group-hover:bg-muted/30 transition-colors">
              {formatShortCurrency(row.pendente)}
            </div>
            <div className="bg-card px-2 py-1 text-right font-medium tabular-nums text-info group-hover:bg-muted/30 transition-colors">
              {formatShortCurrency(row.despesas)}
            </div>
            <div className="bg-card px-2 py-1 text-right font-semibold tabular-nums text-foreground group-hover:bg-muted/30 transition-colors">
              {formatShortCurrency(row.total)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const ChartLegend = memo(function ChartLegend({
  entries,
  hiddenMap,
  onToggle,
}: {
  entries: { label: string; color: string }[]
  hiddenMap: Record<string, boolean>
  onToggle: (label: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
      {entries.map(({ label, color }) => {
        const isHidden = hiddenMap[label] ?? false
        return (
          <button
            key={label}
            onClick={() => onToggle(label)}
            className={cn(
              "group inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer select-none outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
              isHidden
                ? "border-border/20 text-muted-foreground/35"
                : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground hover:shadow-sm",
            )}
          >
            <span
              className={cn(
                "size-2.5 rounded-full transition-all duration-200 shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/10",
                isHidden && "opacity-25",
              )}
              style={{ backgroundColor: color }}
            />
            <span className={cn("transition-all", isHidden && "line-through")}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
})

function ChartsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-[220px] animate-pulse rounded-lg bg-muted/50" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ChartsProps {
  monthlyData: MonthlyData[]
  categoryData: CategoryData[]
}

export function DashboardCharts({ monthlyData, categoryData }: ChartsProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [period, setPeriod] = useState<Period>(3)
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const barRef = useRef<ChartJS<"bar">>(null)
  const doughnutRef = useRef<ChartJS<"doughnut">>(null)
  const [barHidden, setBarHidden] = useState<Record<string, boolean>>({})
  const [doughnutHidden, setDoughnutHidden] = useState<Record<string, boolean>>({})

  const colors = useMemo(() => {
    if (!mounted) {
      return {
        text: "#64748b", grid: "#e2e8f0", card: "#ffffff",
        primary: "#f59e0b", destructive: "#ef4444", info: "#3b82f6",
      }
    }
    return {
      text: readCSSVar("--muted-foreground", "#64748b"),
      grid: readCSSVar("--border", "#e2e8f0"),
      card: readCSSVar("--card", "#ffffff"),
      primary: readCSSVar("--primary", "#f59e0b"),
      destructive: readCSSVar("--destructive", "#ef4444"),
      info: readCSSVar("--info", "#3b82f6"),
    }
  }, [theme, mounted]) // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = useMemo(() => {
    const meses = getMonths(period)
    const dataMap = new Map(monthlyData.map((d) => [d.mes, d]))
    return {
      meses,
      barLabels: meses.map(formatMonthLabel),
      pagoData: meses.map((m) => Number(dataMap.get(m)?.total_pago ?? 0)),
      pendenteData: meses.map((m) => Number(dataMap.get(m)?.total_pendente ?? 0)),
      despesasData: meses.map((m) => Number(dataMap.get(m)?.total_despesas ?? 0)),
      hasBarData: meses.some((m) => {
        const d = dataMap.get(m)
        return d && (Number(d.total_pago) > 0 || Number(d.total_pendente) > 0 || Number(d.total_despesas) > 0)
      }),
    }
  }, [monthlyData, period])

  const hasDoughnutData = useMemo(
    () => categoryData.some((c) => Number(c.total) > 0),
    [categoryData],
  )

  const handleBarClick = useCallback(
    (_event: unknown, elements: { datasetIndex: number; index: number }[]) => {
      if (elements.length > 0) {
        const mes = chartData.meses[elements[0].index]
        if (mes) router.push(`/relatorios?mes=${mes}`)
      }
    },
    [chartData.meses, router],
  )

  const barOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      onClick: handleBarClick as unknown as (event: unknown, elements: unknown[]) => void,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.card,
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.grid,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(Number(ctx.raw))}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: colors.grid, display: false },
          ticks: { color: colors.text, font: { size: 11 } },
        },
        y: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            font: { size: 10 },
            callback: (v) => `R$${Number(v).toFixed(0)}`,
          },
          beginAtZero: true,
        },
      },
    }),
    [colors, handleBarClick],
  )

  const barData = useMemo(
    () => ({
      labels: chartData.barLabels,
      datasets: [
        {
          label: "Pago",
          data: chartData.pagoData,
          backgroundColor: applyAlpha(colors.primary, 0.85),
          borderColor: colors.primary,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.65,
        },
        {
          label: "Pendente",
          data: chartData.pendenteData,
          backgroundColor: applyAlpha(colors.destructive, 0.85),
          borderColor: colors.destructive,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.65,
        },
        {
          label: "Despesas",
          data: chartData.despesasData,
          backgroundColor: applyAlpha(colors.info, 0.85),
          borderColor: colors.info,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.65,
        },
      ],
    }),
    [chartData, colors],
  )

  const doughnutOptions: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.card,
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.grid,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0)
              const pct = total > 0 ? ((Number(ctx.raw) / total) * 100).toFixed(1) : "0"
              return `${formatCurrency(Number(ctx.raw))} (${pct}%)`
            },
          },
        },
      },
    }),
    [colors],
  )

  const doughnutData = useMemo(
    () => ({
      labels: categoryData.map((c) => CATEGORY_LABELS[c.categoria] || c.categoria),
      datasets: [
        {
          data: categoryData.map((c) => Number(c.total)),
          backgroundColor: categoryData.map((c) => CATEGORY_COLORS[c.categoria] || "#64748b"),
          borderColor: colors.card,
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    }),
    [categoryData, colors.card],
  )

  const tableRows = useMemo(
    () =>
      chartData.meses.map((mes, i) => ({
        mes,
        label: chartData.barLabels[i],
        pago: chartData.pagoData[i],
        pendente: chartData.pendenteData[i],
        despesas: chartData.despesasData[i],
        total: chartData.pagoData[i] + chartData.pendenteData[i] + chartData.despesasData[i],
      })),
    [chartData],
  )

  const hasTableData = tableRows.some((r) => r.total > 0)

  const barLegendEntries = useMemo(
    () => [
      { label: "Pago", color: colors.primary },
      { label: "Pendente", color: colors.destructive },
      { label: "Despesas", color: colors.info },
    ],
    [colors],
  )

  const doughnutLegendEntries = useMemo(
    () =>
      categoryData.map((c) => ({
        label: CATEGORY_LABELS[c.categoria] || c.categoria,
        color: CATEGORY_COLORS[c.categoria] || "#64748b",
      })),
    [categoryData],
  )

  const toggleBarDataset = useCallback(
    (label: string) => {
      const chart = barRef.current
      if (!chart) return
      const idx = barData.datasets.findIndex((d) => d.label === label)
      if (idx < 0) return
      const meta = chart.getDatasetMeta(idx)
      meta.hidden = !meta.hidden
      chart.update()
      setBarHidden((prev) => ({ ...prev, [label]: !prev[label] }))
    },
    [barData.datasets],
  )

  const toggleDoughnutCategory = useCallback(
    (label: string) => {
      const chart = doughnutRef.current
      if (!chart) return
      const idx = doughnutData.labels.indexOf(label)
      if (idx < 0) return
      const meta = chart.getDatasetMeta(0)
      const element = meta.data[idx] as { hidden?: boolean }
      element.hidden = !element.hidden
      chart.update()
      setDoughnutHidden((prev) => ({ ...prev, [label]: !prev[label] }))
    },
    [doughnutData.labels],
  )

  if (!mounted) return <ChartsSkeleton />

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="card-hover border-primary/10 animate-fade-in-up delay-5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="size-3.5 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Evolução Mensal
              </CardTitle>
            </div>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
        </CardHeader>
        <CardContent>
          {chartData.hasBarData ? (
            <div className="h-[220px]">
              <Bar ref={barRef} options={barOptions} data={barData} />
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              message={`Nenhum dado nos últimos ${period} meses`}
              actions={
                <>
                  <Link href="/trabalhadores/novo">
                    <Button size="sm" variant="outline" className="cursor-pointer text-xs">
                      <Plus className="size-3 mr-1" />
                      Cadastrar Trabalhador
                    </Button>
                  </Link>
                  <Link href="/despesas/nova">
                    <Button size="sm" variant="outline" className="cursor-pointer text-xs">
                      <Plus className="size-3 mr-1" />
                      Registrar Despesa
                    </Button>
                  </Link>
                </>
              }
            />
          )}
          {chartData.hasBarData && (
            <ChartLegend
              entries={barLegendEntries}
              hiddenMap={barHidden}
              onToggle={toggleBarDataset}
            />
          )}
          {hasTableData && (
            <MonthlyTable
              rows={tableRows}
              onRowClick={(mes) => router.push(`/relatorios?mes=${mes}`)}
            />
          )}
        </CardContent>
      </Card>

      <Card className="card-hover border-primary/10 animate-fade-in-up delay-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <PieChart className="size-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas por Categoria
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {hasDoughnutData ? (
            <div className="h-[220px]">
              <Doughnut ref={doughnutRef} options={doughnutOptions} data={doughnutData} />
            </div>
          ) : (
            <EmptyState
              icon={PieChart}
              message="Nenhuma despesa registrada"
              actions={
                <Link href="/despesas/nova">
                  <Button size="sm" variant="outline" className="cursor-pointer text-xs">
                    <Plus className="size-3 mr-1" />
                    Nova Despesa
                  </Button>
                </Link>
              }
            />
          )}
          {hasDoughnutData && doughnutLegendEntries.length > 0 && (
            <ChartLegend
              entries={doughnutLegendEntries}
              hiddenMap={doughnutHidden}
              onToggle={toggleDoughnutCategory}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
