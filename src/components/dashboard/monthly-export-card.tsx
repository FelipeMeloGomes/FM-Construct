"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { toPng } from "html-to-image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ImageDown } from "lucide-react"

interface MonthlyExportCardProps {
  nomeMes: string
  pago: string
  pendente: string
  despesas: string
}

export function MonthlyExportCard({ nomeMes, pago, pendente, despesas }: MonthlyExportCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (!ref.current) return
    setLoading(true)
    try {
      const dataUrl = await toPng(ref.current, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "#fefcf5",
        pixelRatio: 2,
      })
      const link = document.createElement("a")
      link.download = `resumo-${nomeMes.toLowerCase().replace(/\s+/g, "-")}.png`
      link.href = dataUrl
      link.click()
    } catch {
      toast.error("Erro ao exportar imagem")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up delay-3">
      <Card className="border-primary/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="size-3.5 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resumo do Mês — {nomeMes}
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={handleExport}
              className="cursor-pointer h-7 gap-1.5 text-xs"
            >
              <ImageDown className="size-3.5" />
              {loading ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={ref} className="grid gap-4 sm:grid-cols-3 p-1">
            {[
              { label: "Pago em Trabalhadores", value: pago, color: "text-emerald-500" },
              { label: "Pendente", value: pendente, color: "text-red-500" },
              { label: "Despesas", value: despesas, color: "text-blue-500" },
            ].map((item) => (
              <div key={item.label} className="space-y-0.5">
                <p className="text-xs text-muted-foreground/70">{item.label}</p>
                <p className={`text-lg font-bold tracking-tight ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
