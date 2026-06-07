import { z } from "zod"

export const criarTrabalhadorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  funcao: z.enum(["pedreiro", "servente"]),
  valor_diaria: z.coerce.number().positive("Valor da diária deve ser positivo"),
})
