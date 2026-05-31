import { getDb } from "@/lib/db"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { TransitionLink } from "@/components/layout/transition-link"
import { EditarTrabalhadorForm } from "@/components/trabalhadores/editar-trabalhador-form"
import { DirectionalTransition } from "@/components/layout/directional-transition"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Editar Trabalhador",
}

export default async function EditarTrabalhadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()

  const rows = await db`SELECT id, nome, funcao, valor_diaria FROM trabalhadores WHERE id = ${id}`
  if (rows.length === 0) notFound()

  const trabalhador = rows[0] as { id: string; nome: string; funcao: string; valor_diaria: number }

  return (
    <DirectionalTransition>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TransitionLink href={`/trabalhadores/${trabalhador.id}`} type="nav-back">
          <Button variant="ghost" size="icon" className="cursor-pointer" aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TransitionLink>
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Editar Trabalhador</h1>
          <p className="text-sm text-slate-400 mt-1">Altere os dados do trabalhador</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Dados do Trabalhador</CardTitle>
          <CardDescription>Edite os campos que deseja alterar</CardDescription>
        </CardHeader>
        <CardContent>
          <EditarTrabalhadorForm data={trabalhador} />
        </CardContent>
      </Card>
    </div>
    </DirectionalTransition>
  )
}
