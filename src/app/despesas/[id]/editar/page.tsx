import { getDb } from "@/lib/db"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { TransitionLink } from "@/components/layout/transition-link"
import { EditarDespesaForm } from "@/components/despesas/editar-despesa-form"
import { DirectionalTransition } from "@/components/layout/directional-transition"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Editar Despesa",
}

export default async function EditarDespesaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()

  const rows = await db`SELECT id, descricao, categoria, valor, data, pago_para, observacao FROM despesas WHERE id = ${id}`
  if (rows.length === 0) notFound()

  const despesa = rows[0] as {
    id: string
    descricao: string
    categoria: string
    valor: number
    data: Date
    pago_para?: string
    observacao?: string
  }

  const dataFormatada = despesa.data instanceof Date
    ? despesa.data.toISOString().split("T")[0]
    : String(despesa.data).substring(0, 10)

  return (
    <DirectionalTransition>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TransitionLink href="/despesas" type="nav-back">
          <Button variant="ghost" size="icon" className="cursor-pointer" aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TransitionLink>
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Editar Despesa</h1>
          <p className="text-sm text-slate-400 mt-1">Altere os dados da despesa</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Dados da Despesa</CardTitle>
          <CardDescription>Edite os campos que deseja alterar</CardDescription>
        </CardHeader>
        <CardContent>
          <EditarDespesaForm
            data={{
              id: despesa.id,
              descricao: despesa.descricao,
              categoria: despesa.categoria,
              valor: despesa.valor,
              data: dataFormatada,
              pago_para: despesa.pago_para,
              observacao: despesa.observacao,
            }}
          />
        </CardContent>
      </Card>
    </div>
    </DirectionalTransition>
  )
}
