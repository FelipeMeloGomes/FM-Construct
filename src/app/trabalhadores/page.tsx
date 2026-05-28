/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Users, Edit, Trash2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { deletarTrabalhador } from "@/lib/actions/trabalhadores"
import { RegistrarDiaDialog } from "@/components/trabalhadores/registrar-dia-dialog"

export default async function TrabalhadoresPage() {
  const db = await getDb()
  const trabalhadores = await db`
    SELECT t.*,
      COALESCE(SUM(CASE WHEN NOT d.pago THEN d.valor_dia ELSE 0 END), 0) as total_pendente
    FROM trabalhadores t
    LEFT JOIN dias_trabalhados d ON d.trabalhador_id = t.id
    GROUP BY t.id
    ORDER BY t.ativo DESC, t.nome ASC
  `

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Trabalhadores</h1>
          <p className="text-sm text-slate-400 mt-1">Pedreiros e serventes cadastrados</p>
        </div>
        <Link href="/trabalhadores/novo">
          <Button>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </Link>
      </div>

      {trabalhadores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Users className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhum trabalhador cadastrado</p>
          <p className="text-sm mt-1">Crie o primeiro trabalhador para come&ccedil;ar</p>
          <Link href="/trabalhadores/novo" className="mt-4">
            <Button>Cadastrar Trabalhador</Button>
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Fun&ccedil;&atilde;o</TableHead>
              <TableHead className="hidden md:table-cell">Di&aacute;ria</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Pendente</TableHead>
              <TableHead className="w-20 md:w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trabalhadores.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link href={`/trabalhadores/${t.id}`} className="group inline-flex items-center gap-1 font-medium hover:text-amber-400 transition-colors">
                    {t.nome}
                    <ChevronRight className="size-3.5 text-slate-500 sm:opacity-0 sm:-ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell capitalize">{t.funcao}</TableCell>
                <TableCell className="hidden md:table-cell">{formatCurrency(Number(t.valor_diaria))}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={t.ativo ? "default" : "secondary"}>
                    {t.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-red-400">
                  {formatCurrency(Number(t.total_pendente))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <RegistrarDiaDialog
                      trabalhadorId={t.id}
                      valorDiaria={Number(t.valor_diaria)}
                      trigger={<Button variant="ghost" size="icon" className="size-9 md:size-8 text-emerald-400 hover:text-emerald-300">
                        <Plus className="size-4" />
                      </Button>}
                    />
                    <Link href={`/trabalhadores/${t.id}/editar`}>
                      <Button variant="ghost" size="icon" className="size-9 md:size-8">
                        <Edit className="size-4 md:size-3.5" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="icon" className="size-9 md:size-8 text-slate-500 hover:text-red-400">
                          <Trash2 className="size-4 md:size-3.5" />
                        </Button>}
                      />
                      <AlertDialogContent className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir {t.nome}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Todos os dias registrados e pagamentos ser&atilde;o removidos. Esta a&ccedil;&atilde;o n&atilde;o pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <form action={deletarTrabalhador.bind(null, t.id)}>
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
      )}
    </div>
  )
}
