"use client"

import { useRouter } from "next/navigation"
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
import Link from "next/link"

export default function NovoTrabalhadorPage() {
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    try {
      await criarTrabalhador(formData)
      toast.success("Trabalhador cadastrado com sucesso!")
      router.push("/trabalhadores")
      router.refresh()
    } catch {
      toast.error("Erro ao cadastrar trabalhador")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trabalhadores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
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
              <Input id="nome" name="nome" placeholder="Ex: João Silva" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao">Função</Label>
              <Select name="funcao" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
                placeholder="Ex: 150,00"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Cadastrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
