"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { atualizarTrabalhador } from "@/lib/actions/trabalhadores"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface TrabalhadorData {
  id: string
  nome: string
  funcao: string
  valor_diaria: number
}

export default function EditarTrabalhadorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TrabalhadorData | null>(null)

  useEffect(() => {
    async function load() {
      const { id } = await params
      const res = await fetch(`/api/trabalhadores/${id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error("Trabalhador n\u00e3o encontrado")
        router.push("/trabalhadores")
      }
      setLoading(false)
    }
    load()
  }, [params, router])

  async function handleSubmit(formData: FormData) {
    if (!data) return
    try {
      await atualizarTrabalhador(data.id, formData)
      toast.success("Trabalhador atualizado com sucesso!")
      router.push(`/trabalhadores/${data.id}`)
      router.refresh()
    } catch {
      toast.error("Erro ao atualizar trabalhador")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/trabalhadores/${data.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
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
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" name="nome" defaultValue={data.nome} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao">Função</Label>
              <Select name="funcao" defaultValue={data.funcao} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pedreiro">Pedreiro</SelectItem>
                  <SelectItem value="servente">Servente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_diaria">Valor da diária (R$)</Label>
              <Input
                id="valor_diaria"
                name="valor_diaria"
                type="number"
                step="0.01"
                min="0"
                defaultValue={data.valor_diaria}
                required
              />
            </div>

            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
