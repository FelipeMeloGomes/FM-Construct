import { z } from "zod"

export const registrarDiaSchema = z.object({
  trabalhador_id: z.string().uuid(),
  data: z.string().min(1, "Selecione a data"),
  tipo: z.enum(["inteiro", "meio"]),
  observacao: z.string().optional(),
})

export const registrarPagamentoSchema = z.object({
  dia_id: z.string().uuid(),
  valor_pago: z.coerce.number().positive("Valor pago deve ser positivo"),
  data_pagamento: z.string().min(1, "Selecione a data do pagamento"),
})

export const atualizarDiaSchema = z.object({
  id: z.string().uuid(),
  data: z.string().min(1, "Selecione a data"),
  tipo: z.enum(["inteiro", "meio"]),
  valor_pago: z.coerce.number().positive("Valor pago deve ser positivo").optional(),
  data_pagamento: z.string().optional(),
})
