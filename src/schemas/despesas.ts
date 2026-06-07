import { z } from "zod"

export const criarDespesaSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  categoria: z.enum(["material", "alimentacao", "transporte", "ferramentas", "outros"]),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  data: z.string().min(1, "Selecione a data"),
  pago_para: z.string().optional(),
  observacao: z.string().optional(),
})
