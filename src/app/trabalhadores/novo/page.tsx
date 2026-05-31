"use client"

import { useRouter } from "next/navigation"
import { useState, startTransition, addTransitionType } from "react"
import { toast } from "sonner"
import { criarTrabalhador } from "@/lib/actions/trabalhadores"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { TransitionLink } from "@/components/layout/transition-link"
import { FieldErrors, getFieldErrors } from "@/components/ui/field-error"
import { DirectionalTransition } from "@/components/layout/directional-transition"

export default function NovoTrabalhadorPage() {
  const router = useRouter()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>()

  async function handleSubmit(formData: FormData) {
    setFieldErrors(undefined)
    const result = await criarTrabalhador(formData)
    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      toast.error(result.error)
      return
    }
    toast.success("Trabalhador cadastrado com sucesso!")
    startTransition(() => {
      addTransitionType("nav-back")
      router.push("/trabalhadores")
      router.refresh()
    })
  }

  return (
    <DirectionalTransition>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
          <TransitionLink href="/trabalhadores" type="nav-back">
            <Button variant="ghost" size="icon" className="cursor-pointer" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TransitionLink>
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Novo Trabalhador</h1>
          <p className="text-sm text-slate-400 mt-1">Cadastre um pedreiro ou servente</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Dados do Trabalhador</CardTitle>
          <CardDescription>Informe os dados para cadastro</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" name="nome" placeholder="Ex: João Silva" minLength={3} required aria-invalid={!!getFieldErrors("nome", fieldErrors)} aria-describedby="nome-error" />
              <FieldErrors errors={getFieldErrors("nome", fieldErrors)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao">Função</Label>
              <Select name="funcao" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione">
                    {(value: string | null) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "Selecione"}
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
                min="0.01"
                placeholder="Ex: 150,00"
                required
                aria-invalid={!!getFieldErrors("valor_diaria", fieldErrors)}
                aria-describedby="valor_diaria-error"
              />
              <FieldErrors errors={getFieldErrors("valor_diaria", fieldErrors)} />
            </div>

            <Button type="submit" className="w-full cursor-pointer">
              Cadastrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </DirectionalTransition>
  )
}
