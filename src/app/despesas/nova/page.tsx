"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { criarDespesa } from "@/lib/actions/despesas"
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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NovaDespesaPage() {
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    try {
      await criarDespesa(formData)
      toast.success("Despesa registrada com sucesso!")
      router.push("/despesas")
      router.refresh()
    } catch {
      toast.error("Erro ao registrar despesa")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/despesas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Nova Despesa</h1>
          <p className="text-sm text-slate-400 mt-1">Registre um gasto da obra</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Dados da Despesa</CardTitle>
          <CardDescription>Informe os dados do gasto realizado</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" name="descricao" placeholder="Ex: 10 sacos de cimento" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select name="categoria" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
              <Input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 350,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                name="data"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pago_para">Pago para (opcional)</Label>
              <Input id="pago_para" name="pago_para" placeholder="Ex: Material de Construção Ltda" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Input id="observacao" name="observacao" placeholder="Nota fiscal nº 1234" />
            </div>

            <Button type="submit" className="w-full">
              Registrar Despesa
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
