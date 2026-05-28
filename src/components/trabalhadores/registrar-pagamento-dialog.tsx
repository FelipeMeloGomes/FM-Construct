"use client"

import { useState } from "react"
import { toast } from "sonner"
import { registrarPagamentoDia } from "@/lib/actions/dias"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign } from "lucide-react"

interface RegistrarPagamentoDialogProps {
  diaId: string
  valorDevido: number
}

export function RegistrarPagamentoDialog({ diaId, valorDevido }: RegistrarPagamentoDialogProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    const dataPagamento = formData.get("data_pagamento") as string
    formData.set("dia_id", diaId)
    try {
      await registrarPagamentoDia(formData)
      const dataFormatada = new Date(dataPagamento + "T12:00:00").toLocaleDateString("pt-BR")
      toast.success(`Pago em ${dataFormatada}`)
      setOpen(false)
    } catch {
      toast.error("Erro ao registrar pagamento")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="size-9 sm:h-8 sm:w-auto sm:px-2 text-xs">
        <DollarSign className="size-4 sm:size-3 sm:mr-1" />
        <span className="hidden sm:inline">Pagar</span>
      </Button>} />
      <DialogContent className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                Confirme o valor a ser pago
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="rounded-lg bg-emerald-500/10 p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Valor devido</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(valorDevido)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_pago">Valor pago (R$)</Label>
                <Input
                  id="valor_pago"
                  name="valor_pago"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={valorDevido}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_pagamento">Data do pagamento</Label>
                <Input
                  id="data_pagamento"
                  name="data_pagamento"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit">Confirmar Pagamento</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
