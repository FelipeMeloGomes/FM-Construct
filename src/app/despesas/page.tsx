import { getDb } from "@/lib/db"
import type { Metadata } from "next"
import type { Despesa } from "@/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Despesas",
}

import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Plus, Receipt } from "lucide-react"
import { TransitionLink } from "@/components/layout/transition-link"
import { CATEGORIAS_DESPESA } from "@/types"
import { DirectionalTransition } from "@/components/layout/directional-transition"
import { DespesasTable } from "@/components/despesas/despesas-table"

export default async function DespesasPage() {
  const db = await getDb()
  const despesas = (await db`
    SELECT * FROM despesas ORDER BY data DESC, created_at DESC
  `) as unknown as Despesa[]

  const totais = (await db`
    SELECT categoria, SUM(valor)::decimal as total
    FROM despesas GROUP BY categoria ORDER BY total DESC
  `) as unknown as { categoria: string; total: number }[]

  const totalGeral = totais.reduce((acc: number, t) => acc + Number(t.total), 0)

  return (
    <DirectionalTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Despesas</h1>
          <p className="text-sm text-slate-400 mt-1">
            Total: <span className="text-blue-400 font-medium">{formatCurrency(totalGeral)}</span>
          </p>
        </div>
        <TransitionLink href="/despesas/nova" type="nav-forward">
          <Button className="cursor-pointer">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Despesa</span>
          </Button>
        </TransitionLink>
      </div>

      {totais.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {totais.map((t) => {
            const categoria = t.categoria as string
            const cat = CATEGORIAS_DESPESA.find((c) => c.value === categoria)
            return (
              <Card key={categoria}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-slate-400">{cat?.label || categoria}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base font-bold">{formatCurrency(Number(t.total))}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {despesas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Receipt className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhuma despesa registrada</p>
          <p className="text-sm mt-1">Registre a primeira despesa da obra</p>
          <TransitionLink href="/despesas/nova" type="nav-forward" className="mt-4">
            <Button className="cursor-pointer">Nova Despesa</Button>
          </TransitionLink>
        </div>
      ) : (
        <DespesasTable despesas={despesas} />
      )}
    </div>
    </DirectionalTransition>
  )
}
