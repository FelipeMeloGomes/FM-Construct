import { getDb } from "@/lib/db"
import type { Metadata } from "next"
import type { Trabalhador, DiaTrabalhado } from "@/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Detalhes do Trabalhador",
}

import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RegistrarDiaDialog } from "@/components/trabalhadores/registrar-dia-dialog"
import { SemanaGroup } from "@/components/trabalhadores/semana-group"
import { notFound } from "next/navigation"
import { TransitionLink } from "@/components/layout/transition-link"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { deletarTrabalhador } from "@/lib/actions/trabalhadores"
import { DirectionalTransition } from "@/components/layout/directional-transition"
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"

function getWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  d.setUTCDate(diff)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
}

const MESES_POR_PAGINA = 1

export default async function TrabalhadorDetalhePage(props: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await props.params
  const { page } = await props.searchParams
  const paginaAtual = Math.max(1, Number(page) || 1)

  const db = await getDb()
  const [trabalhador, dias] = await Promise.all([
    db`SELECT * FROM trabalhadores WHERE id = ${id}` as unknown as Trabalhador[],
    db`SELECT * FROM dias_trabalhados WHERE trabalhador_id = ${id} ORDER BY data ASC` as unknown as DiaTrabalhado[],
  ])

  if (!trabalhador[0]) notFound()

  const t = trabalhador[0]
  const totalDevido = dias.reduce((acc: number, d) => acc + Number(d.valor_dia), 0)
  const totalPago = dias.reduce((acc: number, d) => acc + Number(d.valor_pago ?? 0), 0)
  const totalPendente = totalDevido - totalPago

  const diasAgrupados = dias.reduce((acc: Record<string, DiaTrabalhado[]>, d) => {
    const dt = (d.data as unknown instanceof Date ? d.data as unknown as Date : new Date(d.data))
    const mes = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`
    if (!acc[mes]) acc[mes] = []
    acc[mes].push(d)
    return acc
  }, {})

  const meses = Object.keys(diasAgrupados).sort((a, b) => b.localeCompare(a))
  const totalPaginas = Math.max(1, Math.ceil(meses.length / MESES_POR_PAGINA))
  const paginaSegura = Math.min(paginaAtual, totalPaginas)
  const inicio = (paginaSegura - 1) * MESES_POR_PAGINA
  const mesesVisiveis = meses.slice(inicio, inicio + MESES_POR_PAGINA)

  return (
    <DirectionalTransition>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TransitionLink href="/trabalhadores" type="nav-back">
          <Button variant="ghost" size="icon" className="cursor-pointer" aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TransitionLink>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-amber-400">{t.nome}</h1>
            <Badge variant={t.ativo ? "default" : "secondary"} className="capitalize">
              {t.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            <span className="capitalize">{t.funcao}</span> &mdash; Diária: {formatCurrency(Number(t.valor_diaria))}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
          <TransitionLink href={`/trabalhadores/${id}/editar`} type="nav-forward">
            <Button variant="outline" size="sm" className="w-full sm:w-auto cursor-pointer">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </TransitionLink>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="destructive" size="sm" className="w-full sm:w-auto cursor-pointer">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>}
            />
            <AlertDialogContent className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir trabalhador?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos os dias registrados e pagamentos ser&atilde;o removidos. Esta a&ccedil;&atilde;o n&atilde;o pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <form action={deletarTrabalhador.bind(null, id)}>
                                    <Button type="submit" variant="destructive" className="cursor-pointer">Sim, excluir</Button>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Devido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-amber-400">{formatCurrency(totalDevido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalPago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-400">{formatCurrency(totalPendente)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dias Trabalhados</h2>
          {dias.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{dias.length} dia{dias.length > 1 ? "s" : ""} registrado{dias.length > 1 ? "s" : ""} &mdash; Página {paginaSegura} de {totalPaginas}</p>
          )}
        </div>
        <RegistrarDiaDialog trabalhadorId={t.id} valorDiaria={Number(t.valor_diaria)} />
      </div>

      {dias.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Nenhum dia registrado ainda
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {mesesVisiveis.map((mes) => {
            const diasDoMes = diasAgrupados[mes]
            const totalMes = diasDoMes.reduce((acc: number, d) => acc + Number(d.valor_dia), 0)
            const diasInteiros = diasDoMes.filter((d) => d.tipo === "inteiro").length
            const meiosDias = diasDoMes.filter((d) => d.tipo === "meio").length
            const nomeMes = new Date(diasDoMes[0].data).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
            const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)

            const semanas = diasDoMes.reduce((acc: Record<string, DiaTrabalhado[]>, d) => {
              const key = getWeekStart(new Date(d.data))
              if (!acc[key]) acc[key] = []
              acc[key].push(d)
              return acc
            }, {})

            const semanaKeys = Object.keys(semanas).sort()

            return (
              <div key={mes}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-400">{nomeMesCapitalizado}</h3>
                  <div className="text-xs text-slate-500">
                    {diasInteiros}d inteiros {meiosDias > 0 ? `+ ${meiosDias} meio(s)` : ""} &mdash; Total: <span className="text-amber-400 font-medium">{formatCurrency(totalMes)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {semanaKeys.map((semanaKey) => (
                    <SemanaGroup
                      key={semanaKey}
                      diasDaSemana={semanas[semanaKey]}
                      trabalhadorId={t.id}
                      valorDiaria={Number(t.valor_diaria)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <Pagination>
          <PaginationContent>
            {paginaSegura > 1 && (
              <PaginationItem>
                <PaginationPrevious href={`/trabalhadores/${id}?page=${paginaSegura - 1}`} text="Anterior" />
              </PaginationItem>
            )}
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href={`/trabalhadores/${id}?page=${p}`}
                  isActive={p === paginaSegura}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            {paginaSegura < totalPaginas && (
              <PaginationItem>
                <PaginationNext href={`/trabalhadores/${id}?page=${paginaSegura + 1}`} text="Próximo" />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
    </DirectionalTransition>
  )
}
