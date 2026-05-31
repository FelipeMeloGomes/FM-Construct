import { formatCurrency, formatDate } from "@/lib/utils"
import type { DiaTrabalhado } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RegistrarPagamentoDialog } from "@/components/trabalhadores/registrar-pagamento-dialog"
import { EditarDiaDialog } from "@/components/trabalhadores/editar-dia-dialog"
import { Trash2 } from "lucide-react"
import { deletarDia, pagarSemana } from "@/lib/actions/dias"

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

export function SemanaGroup({
  diasDaSemana,
  trabalhadorId,
  valorDiaria,
}: {
  diasDaSemana: DiaTrabalhado[]
  trabalhadorId: string
  valorDiaria: number
}) {
  const pendentes = diasDaSemana.filter((d) => !d.pago)
  const totalPendenteSemana = pendentes.reduce((acc: number, d) => acc + Number(d.valor_dia), 0)
  const hasPendentes = pendentes.length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-medium text-slate-500">
          Semana de {formatWeekRange(new Date(diasDaSemana[0].data))}
        </h4>
        {hasPendentes && (
          <ConfirmDialog
            action={pagarSemana.bind(null, trabalhadorId, pendentes.map((p) => p.id as string))}
            title="Pagar semana?"
            description={`Pagar ${pendentes.length} dia${pendentes.length > 1 ? "s" : ""} no valor total de ${formatCurrency(totalPendenteSemana)}?`}
            confirmText="Sim, pagar"
            successMessage="Semana paga"
            variant="default"
          >
            <Button variant="default" size="sm" className="h-9 text-sm px-4 shadow-sm cursor-pointer">
              Pagar Semana ({pendentes.length} pendente{pendentes.length > 1 ? "s" : ""})
            </Button>
          </ConfirmDialog>
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
          {diasDaSemana.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{formatDate(d.data)}</TableCell>
              <TableCell className="hidden sm:table-cell capitalize">{d.tipo === "inteiro" ? "Dia-Inteiro" : "Meio-Dia"}</TableCell>
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
              <TableCell className="hidden sm:table-cell">{Number(d.valor_pago) > 0 ? formatCurrency(Number(d.valor_pago)) : <span className="text-muted-foreground/60 text-xs">Sem pgto</span>}</TableCell>
              <TableCell className="hidden sm:table-cell">{d.data_pagamento ? formatDate(d.data_pagamento) : <span className="text-muted-foreground/60 text-xs">Sem pgto</span>}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {!d.pago && (
                    <RegistrarPagamentoDialog diaId={d.id} valorDevido={Number(d.valor_dia)} />
                  )}
                  <EditarDiaDialog dia={d} valorDiaria={valorDiaria} />
                  <ConfirmDialog
                    action={deletarDia.bind(null, d.id)}
                    title="Excluir dia?"
                    description={`Remover ${formatDate(d.data)} (${d.tipo === "inteiro" ? "Dia inteiro" : "Meio dia"})?`}
                    successMessage="Dia excluído"
                  >
                    <Button variant="ghost" size="icon" className="size-9 sm:size-7 text-slate-500 hover:text-red-400 cursor-pointer" aria-label="Excluir dia">
                      <Trash2 className="size-4 sm:size-3.5" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
