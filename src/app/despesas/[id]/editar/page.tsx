"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { atualizarDespesa } from "@/lib/actions/despesas"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CATEGORIAS_DESPESA } from "@/types"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface DespesaData {
  id: string
  descricao: string
  categoria: string
  valor: number
  data: string
  pago_para?: string
  observacao?: string
}

export default function EditarDespesaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DespesaData | null>(null)

  useEffect(() => {
    async function load() {
      const { id } = await params
      const res = await fetch(`/api/despesas/${id}`)
      if (res.ok) {
        const json = await res.json()
        setData({
          ...json,
          data: json.data instanceof Date ? json.data.toISOString().split("T")[0] : json.data.substring(0, 10),
        })
      } else {
        toast.error("Despesa n\u00e3o encontrada")
        router.push("/despesas")
      }
      setLoading(false)
    }
    load()
  }, [params, router])

  async function handleSubmit(formData: FormData) {
    if (!data) return
    try {
      await atualizarDespesa(data.id, formData)
      toast.success("Despesa atualizada com sucesso!")
      router.push("/despesas")
      router.refresh()
    } catch {
      toast.error("Erro ao atualizar despesa")
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
        <Link href="/despesas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
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
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descri\u00e7\u00e3o</Label>
              <Input id="descricao" name="descricao" defaultValue={data.descricao} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select name="categoria" defaultValue={data.categoria} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_DESPESA.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input id="valor" name="valor" type="number" step="0.01" min="0" defaultValue={data.valor} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" name="data" type="date" defaultValue={data.data} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pago_para">Pago para (opcional)</Label>
              <Input id="pago_para" name="pago_para" defaultValue={data.pago_para || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observa\u00e7\u00e3o (opcional)</Label>
              <Input id="observacao" name="observacao" defaultValue={data.observacao || ""} />
            </div>

            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
