"use client"

import { useRouter } from "next/navigation"
import { useState, startTransition, addTransitionType } from "react"
import { toast } from "sonner"
import { atualizarTrabalhador } from "@/lib/actions/trabalhadores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FieldErrors, getFieldErrors } from "@/components/ui/field-error"

interface TrabalhadorFormData {
  id: string
  nome: string
  funcao: string
  valor_diaria: number
}

export function EditarTrabalhadorForm({ data }: { data: TrabalhadorFormData }) {
  const router = useRouter()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>()

  async function handleSubmit(formData: FormData) {
    setFieldErrors(undefined)
    const result = await atualizarTrabalhador(data.id, formData)
    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      toast.error(result.error)
      return
    }
    toast.success("Trabalhador atualizado com sucesso!")
    startTransition(() => {
      addTransitionType("nav-forward")
      router.push(`/trabalhadores/${data.id}`)
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" name="nome" defaultValue={data.nome} required aria-invalid={!!getFieldErrors("nome", fieldErrors)} aria-describedby="nome-error" />
        <FieldErrors errors={getFieldErrors("nome", fieldErrors)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="funcao">Função</Label>
        <Select name="funcao" defaultValue={data.funcao} required>
          <SelectTrigger>
            <SelectValue>
              {(value: string | null) => value ? value.charAt(0).toUpperCase() + value.slice(1) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pedreiro">Pedreiro</SelectItem>
            <SelectItem value="servente">Servente</SelectItem>
          </SelectContent>
        </Select>
        <FieldErrors errors={getFieldErrors("funcao", fieldErrors)} />
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
          aria-invalid={!!getFieldErrors("valor_diaria", fieldErrors)}
          aria-describedby="valor_diaria-error"
        />
        <FieldErrors errors={getFieldErrors("valor_diaria", fieldErrors)} />
      </div>

      <Button type="submit" className="w-full cursor-pointer">Salvar</Button>
    </form>
  )
}
