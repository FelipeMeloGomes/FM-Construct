"use client"

import { useState } from "react"
import { toast } from "sonner"
import { atualizarDia } from "@/lib/actions/dias"
import { formatCurrency, toDateInputValue } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Pencil } from "lucide-react"
import { FieldErrors, getFieldErrors } from "@/components/ui/field-error"

interface EditarDiaDialogProps {
  dia: {
    id: string
    data: Date | string
    tipo: string
    valor_dia: number
    pago: boolean
    valor_pago: number | null
    data_pagamento: Date | string | null
  }
  valorDiaria: number
}

export function EditarDiaDialog({ dia, valorDiaria }: EditarDiaDialogProps) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<"inteiro" | "meio">(dia.tipo as "inteiro" | "meio")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>()

  const valorCalculado = tipo === "inteiro" ? valorDiaria : valorDiaria / 2

  async function handleSubmit(formData: FormData) {
    setFieldErrors(undefined)
    formData.set("id", dia.id)
    formData.set("tipo", tipo)
    const result = await atualizarDia(formData)
    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      toast.error(result.error)
      return
    }
    toast.success("Dia atualizado com sucesso!")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setFieldErrors(undefined) }}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="size-9 sm:size-7 text-slate-500 hover:text-amber-400 cursor-pointer" aria-label="Editar dia">
        <Pencil className="size-4 sm:size-3.5" />
      </Button>} />
      <DialogContent className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle>Editar Dia Trabalhado</DialogTitle>
              <DialogDescription>
                Altere a data ou o tipo de dia
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input id="data" name="data" type="date" defaultValue={toDateInputValue(dia.data)} required aria-invalid={!!getFieldErrors("data", fieldErrors)} aria-describedby="data-error" />
                <FieldErrors errors={getFieldErrors("data", fieldErrors)} />
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
                    <Label htmlFor="meio">Meio dia</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="rounded-lg bg-amber-500/10 p-3 text-sm">
                Valor calculado: <strong className="text-amber-400">R$ {valorCalculado.toFixed(2)}</strong>
              </div>

              {dia.pago && Number(dia.valor_pago ?? 0) > 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="valor_pago">Valor pago (R$)</Label>
                    <Input
                      id="valor_pago"
                      name="valor_pago"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue={dia.valor_pago ?? valorCalculado}
                      required
                      aria-invalid={!!getFieldErrors("valor_pago", fieldErrors)}
                      aria-describedby="valor_pago-error"
                    />
                    <FieldErrors errors={getFieldErrors("valor_pago", fieldErrors)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_pagamento">Data do pagamento</Label>
                    <Input
                      id="data_pagamento"
                      name="data_pagamento"
                      type="date"
                      defaultValue={toDateInputValue(dia.data_pagamento)}
                      required
                      aria-invalid={!!getFieldErrors("data_pagamento", fieldErrors)}
                      aria-describedby="data_pagamento-error"
                    />
                    <FieldErrors errors={getFieldErrors("data_pagamento", fieldErrors)} />
                  </div>
                </>
              )}

              <DialogFooter>
                <Button type="submit" className="cursor-pointer">Salvar</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
