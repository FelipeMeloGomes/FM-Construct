"use client"

import { useState, ReactElement } from "react"
import { toast } from "sonner"
import { registrarDia } from "@/lib/actions/dias"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus } from "lucide-react"

interface RegistrarDiaDialogProps {
  trabalhadorId: string
  valorDiaria: number
  trigger?: ReactElement
}

export function RegistrarDiaDialog({ trabalhadorId, valorDiaria, trigger }: RegistrarDiaDialogProps) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<"inteiro" | "meio">("inteiro")
  const today = new Date().toLocaleDateString("en-CA")
  const valorCalculado = tipo === "inteiro" ? valorDiaria : valorDiaria / 2

  async function handleSubmit(formData: FormData) {
    formData.set("trabalhador_id", trabalhadorId)
    formData.set("tipo", tipo)
    try {
      await registrarDia(formData)
      toast.success("Dia registrado com sucesso!")
      setOpen(false)
    } catch {
      toast.error("Erro ao registrar dia")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Registrar Dia
      </Button>} />
      <DialogContent className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle>Registrar Dia Trabalhado</DialogTitle>
              <DialogDescription>
                Informe a data e o tipo de dia trabalhado
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input id="data" name="data" type="date" defaultValue={today} required />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as "inteiro" | "meio")}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="inteiro" id="inteiro" />
                    <Label htmlFor="inteiro">Dia inteiro</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="meio" id="meio" />
                    <Label htmlFor="meio">Meio-dia</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Input id="observacao" name="observacao" placeholder="Ex: Só trabalhou até o almoço" />
              </div>

              <div className="rounded-lg bg-amber-500/10 p-3 text-sm">
                Valor calculado: <strong className="text-amber-400">
                  R$ {valorCalculado.toFixed(2)}
                </strong>
              </div>

              <DialogFooter>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
