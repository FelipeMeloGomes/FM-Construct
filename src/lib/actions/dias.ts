"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getDb } from "@/lib/db"

const registrarDiaSchema = z.object({
  trabalhador_id: z.string().uuid(),
  data: z.string().min(1, "Selecione a data"),
  tipo: z.enum(["inteiro", "meio"]),
  observacao: z.string().optional(),
})

export async function registrarDia(formData: FormData) {
  const parsed = registrarDiaSchema.parse(Object.fromEntries(formData))
  const db = await getDb()

  const trabalhador = await db`
    SELECT valor_diaria FROM trabalhadores WHERE id = ${parsed.trabalhador_id}
  `
  if (!trabalhador[0]) throw new Error("Trabalhador não encontrado")

  const valorDiaria = Number(trabalhador[0].valor_diaria)
  const valorDia = parsed.tipo === "inteiro" ? valorDiaria : valorDiaria / 2

  await db`
    INSERT INTO dias_trabalhados (trabalhador_id, data, tipo, valor_dia, observacao)
    VALUES (${parsed.trabalhador_id}, ${parsed.data}, ${parsed.tipo}, ${valorDia}, ${parsed.observacao || null})
  `

  revalidatePath(`/trabalhadores/${parsed.trabalhador_id}`)
  revalidatePath("/")
}

const registrarPagamentoSchema = z.object({
  dia_id: z.string().uuid(),
  valor_pago: z.coerce.number().positive("Valor pago deve ser positivo"),
  data_pagamento: z.string().min(1, "Selecione a data do pagamento"),
})

export async function registrarPagamentoDia(formData: FormData) {
  const parsed = registrarPagamentoSchema.parse(Object.fromEntries(formData))
  const db = await getDb()

  const dia = await db`
    SELECT trabalhador_id FROM dias_trabalhados WHERE id = ${parsed.dia_id}
  `
  if (!dia[0]) throw new Error("Registro não encontrado")

  await db`
    UPDATE dias_trabalhados
    SET pago = true, valor_pago = ${parsed.valor_pago}, data_pagamento = ${parsed.data_pagamento}
    WHERE id = ${parsed.dia_id}
  `

  revalidatePath(`/trabalhadores/${dia[0].trabalhador_id}`)
  revalidatePath("/")
}

const atualizarDiaSchema = z.object({
  id: z.string().uuid(),
  data: z.string().min(1, "Selecione a data"),
  tipo: z.enum(["inteiro", "meio"]),
  valor_pago: z.coerce.number().optional(),
  data_pagamento: z.string().optional(),
})

export async function atualizarDia(formData: FormData) {
  const parsed = atualizarDiaSchema.parse(Object.fromEntries(formData))
  const db = await getDb()

  const dia = await db`
    SELECT d.trabalhador_id, t.valor_diaria, d.pago
    FROM dias_trabalhados d
    JOIN trabalhadores t ON t.id = d.trabalhador_id
    WHERE d.id = ${parsed.id}
  `
  if (!dia[0]) throw new Error("Registro não encontrado")

  const { trabalhador_id, valor_diaria, pago } = dia[0] as { trabalhador_id: string; valor_diaria: number; pago: boolean }
  const novoValorDia = parsed.tipo === "inteiro" ? Number(valor_diaria) : Number(valor_diaria) / 2
  const novoPago = pago ? (parsed.valor_pago != null && parsed.valor_pago > 0) : false

  await db`
    UPDATE dias_trabalhados
    SET
      data = ${parsed.data},
      tipo = ${parsed.tipo},
      valor_dia = ${novoValorDia},
      pago = ${novoPago},
      valor_pago = ${novoPago ? parsed.valor_pago : null},
      data_pagamento = ${novoPago ? parsed.data_pagamento : null}
    WHERE id = ${parsed.id}
  `

  revalidatePath(`/trabalhadores/${trabalhador_id}`)
  revalidatePath("/")
}

export async function pagarSemana(trabalhadorId: string, diaIds: string[]) {
  const db = await getDb()

  for (const id of diaIds) {
    await db`
      UPDATE dias_trabalhados
      SET pago = true, valor_pago = valor_dia, data_pagamento = CURRENT_DATE
      WHERE id = ${id} AND pago = false
    `
  }

  revalidatePath(`/trabalhadores/${trabalhadorId}`)
  revalidatePath("/")
}

export async function deletarDia(id: string) {
  const db = await getDb()
  const dia = await db`
    SELECT trabalhador_id FROM dias_trabalhados WHERE id = ${id}
  `
  if (!dia[0]) throw new Error("Registro não encontrado")

  await db`DELETE FROM dias_trabalhados WHERE id = ${id}`

  revalidatePath(`/trabalhadores/${dia[0].trabalhador_id}`)
  revalidatePath("/")
}

export async function listarDias(trabalhadorId: string) {
  const db = await getDb()
  return await db`
    SELECT * FROM dias_trabalhados
    WHERE trabalhador_id = ${trabalhadorId}
    ORDER BY data DESC
  `
}
