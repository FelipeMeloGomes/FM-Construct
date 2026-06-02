import { getDb } from "@/lib/db"
import type { Metadata } from "next"
import type { Trabalhador } from "@/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Trabalhadores",
}

import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import { TransitionLink } from "@/components/layout/transition-link"
import { DirectionalTransition } from "@/components/layout/directional-transition"
import { TrabalhadoresTable } from "@/components/trabalhadores/trabalhadores-table"

export default async function TrabalhadoresPage() {
  const db = await getDb()
  const trabalhadores = (await db`
    SELECT t.*,
      COALESCE(SUM(CASE WHEN NOT d.pago THEN d.valor_dia ELSE 0 END), 0) as total_pendente
    FROM trabalhadores t
    LEFT JOIN dias_trabalhados d ON d.trabalhador_id = t.id
    GROUP BY t.id
    ORDER BY t.ativo DESC, t.nome ASC
  `) as unknown as (Trabalhador & { total_pendente: number })[]

  return (
    <DirectionalTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Trabalhadores</h1>
          <p className="text-sm text-muted-foreground mt-1">Pedreiros e serventes cadastrados</p>
        </div>
        <TransitionLink href="/trabalhadores/novo" type="nav-forward">
          <Button className="cursor-pointer">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </TransitionLink>
      </div>

      {trabalhadores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nenhum trabalhador cadastrado</p>
          <p className="text-sm mt-1">Crie o primeiro trabalhador para come&ccedil;ar</p>
          <TransitionLink href="/trabalhadores/novo" type="nav-forward" className="mt-4">
            <Button className="cursor-pointer">Cadastrar Trabalhador</Button>
          </TransitionLink>
        </div>
      ) : (
        <TrabalhadoresTable trabalhadores={trabalhadores} />
      )}
    </div>
    </DirectionalTransition>
  )
}
