import { getDb } from "@/lib/db"
import type { Metadata } from "next"
import type { Despesa } from "@/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Despesas",
}

import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Plus, Receipt, Trash2, Edit } from "lucide-react"
import { TransitionLink } from "@/components/layout/transition-link"
import { deletarDespesa } from "@/lib/actions/despesas"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CATEGORIAS_DESPESA } from "@/types"
import { DirectionalTransition } from "@/components/layout/directional-transition"

const categoryColors: Record<string, string> = {
  material: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  alimentacao: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  transporte: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ferramentas: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  outros: "bg-slate-500/20 text-slate-400 border-slate-500/30",
}

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead className="hidden sm:table-cell">Pago para</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesas.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{formatDate(d.data)}</TableCell>
                <TableCell className="font-medium">{d.descricao}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className={categoryColors[d.categoria] || categoryColors.outros}>
                    {CATEGORIAS_DESPESA.find((c) => c.value === d.categoria)?.label || d.categoria}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-slate-400">{d.pago_para || <span className="text-muted-foreground/60 text-xs">Sem pgto</span>}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(Number(d.valor))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TransitionLink href={`/despesas/${d.id}/editar`} type="nav-forward">
                      <Button variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-amber-400 cursor-pointer" aria-label="Editar despesa">
                        <Edit className="size-3.5" />
                      </Button>
                    </TransitionLink>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-red-400 cursor-pointer" aria-label="Excluir despesa">
                          <Trash2 className="size-3.5" />
                        </Button>}
                      />
                    <AlertDialogContent className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remover &quot;{d.descricao}&quot; no valor de {formatCurrency(Number(d.valor))}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <form action={deletarDespesa.bind(null, d.id)}>
                          <Button type="submit" variant="destructive" className="cursor-pointer">Sim, excluir</Button>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
    </DirectionalTransition>
  )
}
