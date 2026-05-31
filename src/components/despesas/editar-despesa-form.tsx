"use client"

import { useRouter } from "next/navigation"
import { useState, startTransition, addTransitionType } from "react"
import { toast } from "sonner"
import { atualizarDespesa } from "@/lib/actions/despesas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CATEGORIAS_DESPESA } from "@/types"
import { FieldErrors, getFieldErrors } from "@/components/ui/field-error"

interface DespesaFormData {
  id: string
  descricao: string
  categoria: string
  valor: number
  data: string
  pago_para?: string
  observacao?: string
}

export function EditarDespesaForm({ data }: { data: DespesaFormData }) {
  const router = useRouter()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>()

  async function handleSubmit(formData: FormData) {
    setFieldErrors(undefined)
    const result = await atualizarDespesa(data.id, formData)
    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      toast.error(result.error)
      return
    }
    toast.success("Despesa atualizada com sucesso!")
    startTransition(() => {
      addTransitionType("nav-back")
      router.push("/despesas")
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input id="descricao" name="descricao" defaultValue={data.descricao} required aria-invalid={!!getFieldErrors("descricao", fieldErrors)} aria-describedby="descricao-error" />
        <FieldErrors errors={getFieldErrors("descricao", fieldErrors)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <Select name="categoria" defaultValue={data.categoria} required>
          <SelectTrigger>
            <SelectValue>
              {(value: string | null) => value ? CATEGORIAS_DESPESA.find(c => c.value === value)?.label || value : null}
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
        <Input id="valor" name="valor" type="number" step="0.01" min="0" defaultValue={data.valor} required aria-invalid={!!getFieldErrors("valor", fieldErrors)} aria-describedby="valor-error" />
        <FieldErrors errors={getFieldErrors("valor", fieldErrors)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Input id="data" name="data" type="date" defaultValue={data.data} required aria-invalid={!!getFieldErrors("data", fieldErrors)} aria-describedby="data-error" />
        <FieldErrors errors={getFieldErrors("data", fieldErrors)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pago_para">Pago para (opcional)</Label>
        <Input id="pago_para" name="pago_para" defaultValue={data.pago_para || ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacao">Observação (opcional)</Label>
        <Input id="observacao" name="observacao" defaultValue={data.observacao || ""} />
      </div>

      <Button type="submit" className="w-full cursor-pointer">Salvar</Button>
    </form>
  )
}
