/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RegistrarDiaDialog } from "@/components/trabalhadores/registrar-dia-dialog"
import { RegistrarPagamentoDialog } from "@/components/trabalhadores/registrar-pagamento-dialog"
import { EditarDiaDialog } from "@/components/trabalhadores/editar-dia-dialog"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Pencil, Trash2 } from "lucide-react"
import { deletarDia, pagarSemana } from "@/lib/actions/dias"
import { deletarTrabalhador } from "@/lib/actions/trabalhadores"

function getWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  d.setUTCDate(diff)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
}

function formatWeekRange(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(d)
  start.setUTCDate(diff)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  const fmt = (dt: Date) => dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
  return `${fmt(start)} a ${fmt(end)}`
}

export default async function TrabalhadorDetalhePage(props: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ mostrar?: string }>
}) {
  const { id } = await props.params
  const { mostrar } = await props.searchParams
  const mostrarTodos = mostrar === "todos"

  const db = await getDb()
  const [trabalhador, dias] = await Promise.all([
    db`SELECT * FROM trabalhadores WHERE id = ${id}`,
    db`SELECT * FROM dias_trabalhados WHERE trabalhador_id = ${id} ORDER BY data ASC`,
  ])

  if (!trabalhador[0]) notFound()

  const t = trabalhador[0] as any
  const totalDevido = dias.reduce((acc: number, d: any) => acc + Number(d.valor_dia), 0)
  const totalPago = dias.reduce((acc: number, d: any) => acc + Number(d.valor_pago ?? 0), 0)
  const totalPendente = totalDevido - totalPago

  const diasAgrupados = dias.reduce((acc: Record<string, any[]>, d: any) => {
    const dt = d.data instanceof Date ? d.data : new Date(d.data)
    const mes = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`
    if (!acc[mes]) acc[mes] = []
    acc[mes].push(d)
    return acc
  }, {})

  const meses = Object.keys(diasAgrupados).sort((a, b) => a.localeCompare(b))
  const mesesVisiveis = mostrarTodos ? meses : meses.slice(-3)
  const mesesOcultos = meses.length - mesesVisiveis.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trabalhadores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-amber-400">{t.nome}</h1>
            <Badge variant={t.ativo ? "default" : "secondary"} className="capitalize">
              {t.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {t.funcao} &mdash; Diária: {formatCurrency(Number(t.valor_diaria))}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
          <Link href={`/trabalhadores/${id}/editar`}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="destructive" size="sm" className="w-full sm:w-auto">
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
                  <Button type="submit" variant="destructive">Sim, excluir</Button>
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

      {mesesOcultos > 0 && (
        <div className="text-center">
          <Link href={`/trabalhadores/${id}?mostrar=todos`}>
            <Button variant="outline" size="sm">
              Mostrar todos ({meses.length} meses, {dias.length} dias)
            </Button>
          </Link>
        </div>
      )}

      {mostrarTodos && meses.length > 3 && (
        <div className="text-center">
          <Link href={`/trabalhadores/${id}`}>
            <Button variant="ghost" size="sm">
              Mostrar menos
            </Button>
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dias Trabalhados</h2>
          {!mostrarTodos && meses.length > 3 && (
            <p className="text-xs text-slate-500 mt-0.5">Mostrando os 3 meses mais recentes</p>
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
            const totalMes = diasDoMes.reduce((acc: number, d: any) => acc + Number(d.valor_dia), 0)
            const diasInteiros = diasDoMes.filter((d: any) => d.tipo === "inteiro").length
            const meiosDias = diasDoMes.filter((d: any) => d.tipo === "meio").length
            const nomeMes = new Date(diasDoMes[0].data).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
            const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)

            const semanas = diasDoMes.reduce((acc: Record<string, any[]>, d: any) => {
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
                  {semanaKeys.map((semanaKey) => {
                    const diasDaSemana = semanas[semanaKey]
                    const pendentes = diasDaSemana.filter((d: any) => !d.pago)
                    const totalPendenteSemana = pendentes.reduce((acc: number, d: any) => acc + Number(d.valor_dia), 0)
                    const hasPendentes = pendentes.length > 0

                    return (
                      <div key={semanaKey}>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-medium text-slate-500">
                            Semana de {formatWeekRange(new Date(semanaKey))}
                          </h4>
                          {hasPendentes && (
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={<Button variant="outline" size="xs" className="h-6 text-xs">
                                  Pagar semana ({pendentes.length} pendente{pendentes.length > 1 ? "s" : ""})
                                </Button>}
                              />
                              <AlertDialogContent size="sm" className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Pagar semana?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Pagar {pendentes.length} dia{pendentes.length > 1 ? "s" : ""} no valor total de {formatCurrency(totalPendenteSemana)}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <form action={pagarSemana.bind(null, t.id, pendentes.map((p: any) => p.id))}>
                                    <Button type="submit" variant="default">Sim, pagar</Button>
                                  </form>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="hidden sm:table-cell">Valor Pago</TableHead>
                              <TableHead className="hidden sm:table-cell">Data Pagto</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {diasDaSemana.map((d: any) => (
                              <TableRow key={d.id}>
                                <TableCell>{formatDate(d.data)}</TableCell>
                                <TableCell className="hidden sm:table-cell capitalize">{d.tipo === "inteiro" ? "Inteiro" : "Meio-dia"}</TableCell>
                                <TableCell>{formatCurrency(Number(d.valor_dia))}</TableCell>
                                <TableCell>
                                  {Number(d.valor_pago ?? 0) >= Number(d.valor_dia) ? (
                                    <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                      Pago
                                    </Badge>
                                  ) : Number(d.valor_pago ?? 0) > 0 ? (
                                    <Badge variant="default" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                      Parcial
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">Pendente</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{Number(d.valor_pago) > 0 ? formatCurrency(Number(d.valor_pago)) : "-"}</TableCell>
                                <TableCell className="hidden sm:table-cell">{d.data_pagamento ? formatDate(d.data_pagamento) : "-"}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {!d.pago && (
                                      <RegistrarPagamentoDialog diaId={d.id} valorDevido={Number(d.valor_dia)} />
                                    )}
                                    <EditarDiaDialog dia={d} valorDiaria={Number(t.valor_diaria)} />
                                    <AlertDialog>
                                      <AlertDialogTrigger
                                        render={<Button variant="ghost" size="icon" className="size-9 sm:size-7 text-slate-500 hover:text-red-400">
                                          <Trash2 className="size-4 sm:size-3.5" />
                                        </Button>}
                                      />
            <AlertDialogContent className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Excluir dia?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Remover {formatDate(d.data)} ({d.tipo === "inteiro" ? "Dia inteiro" : "Meio dia"})?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <form action={deletarDia.bind(null, d.id)}>
                                            <Button type="submit" variant="destructive">Sim, excluir</Button>
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
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
