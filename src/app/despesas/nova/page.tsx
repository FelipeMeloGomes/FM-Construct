"use client"

import { useRouter } from "next/navigation"
import { useState, startTransition, addTransitionType } from "react"
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
import { FieldErrors, getFieldErrors } from "@/components/ui/field-error"
import { DirectionalTransition } from "@/components/layout/directional-transition"
import { TransitionLink } from "@/components/layout/transition-link"

export default function NovaDespesaPage() {
  const router = useRouter()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>()

  async function handleSubmit(formData: FormData) {
    setFieldErrors(undefined)
    const result = await criarDespesa(formData)
    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      toast.error(result.error)
      return
    }
    toast.success("Despesa registrada com sucesso!")
    startTransition(() => {
      addTransitionType("nav-back")
      router.push("/despesas")
      router.refresh()
    })
  }

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
              <Input id="descricao" name="descricao" placeholder="Ex: 10 sacos de cimento" required aria-invalid={!!getFieldErrors("descricao", fieldErrors)} aria-describedby="descricao-error" />
              <FieldErrors errors={getFieldErrors("descricao", fieldErrors)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select name="categoria" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione">
                    {(value: string | null) => value ? CATEGORIAS_DESPESA.find(c => c.value === value)?.label || value : "Selecione"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_DESPESA.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldErrors errors={getFieldErrors("categoria", fieldErrors)} />
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
                aria-invalid={!!getFieldErrors("valor", fieldErrors)}
                aria-describedby="valor-error"
              />
              <FieldErrors errors={getFieldErrors("valor", fieldErrors)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                name="data"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
                aria-invalid={!!getFieldErrors("data", fieldErrors)}
                aria-describedby="data-error"
              />
              <FieldErrors errors={getFieldErrors("data", fieldErrors)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pago_para">Pago para (opcional)</Label>
              <Input id="pago_para" name="pago_para" placeholder="Ex: Material de Construção Ltda" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Input id="observacao" name="observacao" placeholder="Nota fiscal nº 1234" />
            </div>

            <Button type="submit" className="w-full cursor-pointer">
              Registrar Despesa
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </DirectionalTransition>
  )
}
