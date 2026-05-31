"use client"

import { useEffect, useRef, useState } from "react"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, type ChartOptions } from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
import { useTheme } from "@/components/theme/theme-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChart } from "lucide-react"

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

function getLast6Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = `${String(d.getMonth() + 1).padStart(2, "0")}`
    months.push(`${d.getFullYear()}-${m}`)
  }
  return months
}

function formatMonthLabel(ym: string): string {
  const m = ym.split("-")[1]
  return MONTH_LABELS[m] || m
}

const CATEGORY_COLORS: Record<string, string> = {
  material: "#f59e0b",
  alimentacao: "#10b981",
  transporte: "#8b5cf6",
  ferramentas: "#06b6d4",
  outros: "#64748b",
}

function readCSSVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

interface ChartsProps {
  monthlyData: MonthlyData[]
  categoryData: CategoryData[]
}

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

export function DashboardCharts({ monthlyData, categoryData }: ChartsProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [colors, setColors] = useState({ text: "#94a3b8", grid: "#334155", card: "#1e293b" })
  const barRef = useRef<ChartJS<"bar">>(null)
  const doughnutRef = useRef<ChartJS<"doughnut">>(null)

  useEffect(() => {
    setMounted(true)
    setColors({
      text: readCSSVar("--muted-foreground", "#94a3b8"),
      grid: readCSSVar("--border", "#334155"),
      card: readCSSVar("--card", "#1e293b"),
    })
  }, [])

  useEffect(() => {
    if (!mounted) return
    const c = {
      text: readCSSVar("--muted-foreground", theme === "dark" ? "#94a3b8" : "#64748b"),
      grid: readCSSVar("--border", theme === "dark" ? "#334155" : "#e2e8f0"),
      card: readCSSVar("--card", theme === "dark" ? "#1e293b" : "#ffffff"),
    }
    setColors(c)
  }, [theme, mounted])

  const meses = getLast6Months()
  const dataMap = new Map(monthlyData.map((d) => [d.mes, d]))

  const barLabels = meses.map(formatMonthLabel)
  const pagoData = meses.map((m) => Number(dataMap.get(m)?.total_pago ?? 0))
  const pendenteData = meses.map((m) => Number(dataMap.get(m)?.total_pendente ?? 0))
  const despesasData = meses.map((m) => Number(dataMap.get(m)?.total_despesas ?? 0))

  const hasBarData = pagoData.some((v) => v > 0) || pendenteData.some((v) => v > 0) || despesasData.some((v) => v > 0)
  const hasDoughnutData = categoryData.some((c) => Number(c.total) > 0)

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: colors.text,
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          font: { family: "inherit", size: 11 },
        },
      },
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
          label: (ctx) => `R$ ${Number(ctx.raw).toFixed(2)}`,
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
  }

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: "Pago",
        data: pagoData,
        backgroundColor: "oklch(0.72 0.19 70 / 0.85)",
        borderColor: "oklch(0.72 0.19 70)",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.65,
      },
      {
        label: "Pendente",
        data: pendenteData,
        backgroundColor: "oklch(0.58 0.22 27 / 0.85)",
        borderColor: "oklch(0.58 0.22 27)",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.65,
      },
      {
        label: "Despesas",
        data: despesasData,
        backgroundColor: "oklch(0.6 0.18 250 / 0.85)",
        borderColor: "oklch(0.6 0.18 250)",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.65,
      },
    ],
  }

  const doughnutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: colors.text,
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          font: { family: "inherit", size: 11 },
        },
      },
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
            return `R$ ${Number(ctx.raw).toFixed(2)} (${pct}%)`
          },
        },
      },
    },
  }

  const doughnutData = {
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
  }

  if (!mounted) return <ChartsSkeleton />

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-primary/10 animate-fade-in-up delay-5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="size-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Evolução Mensal
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {hasBarData ? (
            <div className="h-[220px]">
              <Bar ref={barRef} options={barOptions} data={barData} />
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              Nenhum dado nos últimos 6 meses
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/10 animate-fade-in-up delay-6">
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
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              Nenhuma despesa registrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
