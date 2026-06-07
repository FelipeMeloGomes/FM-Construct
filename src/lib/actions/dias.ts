"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getDb } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import type { ActionResult } from "./shared"

const registrarDiaSchema = z.object({
  trabalhador_id: z.string().uuid(),
  data: z.string().min(1, "Selecione a data"),
  tipo: z.enum(["inteiro", "meio"]),
  observacao: z.string().optional(),
})

export async function registrarDia(formData: FormData): Promise<ActionResult> {
  await requireAuth()
  const parsed = registrarDiaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: "Verifique os campos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const db = await getDb()

  const trabalhador = await db`
    SELECT valor_diaria, nome FROM trabalhadores WHERE id = ${parsed.data.trabalhador_id}
  `
  if (!trabalhador[0]) return { success: false, error: "Trabalhador não encontrado" }

  const valorDiaria = Number(trabalhador[0].valor_diaria)
  const valorDia = parsed.data.tipo === "inteiro" ? valorDiaria : valorDiaria / 2

  try {
    await db`
      INSERT INTO dias_trabalhados (trabalhador_id, data, tipo, valor_dia, observacao)
      VALUES (${parsed.data.trabalhador_id}, ${parsed.data.data}, ${parsed.data.tipo}, ${valorDia}, ${parsed.data.observacao || null})
    `
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "23505") {
      const dataFormatada = new Date(parsed.data.data).toLocaleDateString("pt-BR")
      return { success: false, error: `${trabalhador[0].nome} já tem registro no dia ${dataFormatada}` }
    }
    return { success: false, error: "Erro ao salvar no banco de dados" }
  }

  logAudit("registrar_dia", `Trabalhador: ${parsed.data.trabalhador_id}, Data: ${parsed.data.data}`)
  revalidatePath(`/trabalhadores/${parsed.data.trabalhador_id}`)
  revalidatePath("/")
  return { success: true }
}

const registrarPagamentoSchema = z.object({
  dia_id: z.string().uuid(),
  valor_pago: z.coerce.number().positive("Valor pago deve ser positivo"),
  data_pagamento: z.string().min(1, "Selecione a data do pagamento"),
})

export async function registrarPagamentoDia(formData: FormData): Promise<ActionResult> {
  await requireAuth()
  const parsed = registrarPagamentoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: "Verifique os campos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const db = await getDb()

  const dia = await db`
    SELECT trabalhador_id FROM dias_trabalhados WHERE id = ${parsed.data.dia_id}
  `
  if (!dia[0]) return { success: false, error: "Registro não encontrado" }

  await db`
    UPDATE dias_trabalhados
    SET pago = true, valor_pago = ${parsed.data.valor_pago}, data_pagamento = ${parsed.data.data_pagamento}
    WHERE id = ${parsed.data.dia_id}
  `

  logAudit("registrar_pagamento", `Dia: ${parsed.data.dia_id}, Valor: ${parsed.data.valor_pago}`)
  revalidatePath(`/trabalhadores/${dia[0].trabalhador_id}`)
  revalidatePath("/")
  return { success: true }
}

const atualizarDiaSchema = z.object({
  id: z.string().uuid(),
  data: z.string().min(1, "Selecione a data"),
  tipo: z.enum(["inteiro", "meio"]),
  valor_pago: z.coerce.number().positive("Valor pago deve ser positivo").optional(),
  data_pagamento: z.string().optional(),
})

export async function atualizarDia(formData: FormData): Promise<ActionResult> {
  await requireAuth()
  const parsed = atualizarDiaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: "Verifique os campos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const db = await getDb()

  const dia = await db`
    SELECT d.trabalhador_id, t.valor_diaria, d.pago, t.nome
    FROM dias_trabalhados d
    JOIN trabalhadores t ON t.id = d.trabalhador_id
    WHERE d.id = ${parsed.data.id}
  `
  if (!dia[0]) return { success: false, error: "Registro não encontrado" }

  const { trabalhador_id, valor_diaria, pago, nome } = dia[0] as { trabalhador_id: string; valor_diaria: number; pago: boolean; nome: string }
  const novoValorDia = parsed.data.tipo === "inteiro" ? Number(valor_diaria) : Number(valor_diaria) / 2
  const novoPago = pago ? (parsed.data.valor_pago != null && parsed.data.valor_pago > 0) : false

  try {
    await db`
      UPDATE dias_trabalhados
      SET
        data = ${parsed.data.data},
        tipo = ${parsed.data.tipo},
        valor_dia = ${novoValorDia},
        pago = ${novoPago},
        valor_pago = ${novoPago ? parsed.data.valor_pago : null},
        data_pagamento = ${novoPago ? parsed.data.data_pagamento : null}
      WHERE id = ${parsed.data.id}
    `
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "23505") {
      const dataFormatada = new Date(parsed.data.data).toLocaleDateString("pt-BR")
      return { success: false, error: `${nome} já tem registro no dia ${dataFormatada}` }
    }
    return { success: false, error: "Erro ao salvar no banco de dados" }
  }

  logAudit("atualizar_dia", `ID: ${parsed.data.id}`)
  revalidatePath(`/trabalhadores/${trabalhador_id}`)
  revalidatePath("/")
  return { success: true }
}

const uuidSchema = z.string().uuid()

export async function pagarSemana(trabalhadorId: string, diaIds: string[]): Promise<ActionResult> {
  await requireAuth()
  const idOk = uuidSchema.safeParse(trabalhadorId)
  if (!idOk.success) return { success: false, error: "ID inválido" }
  const idsOk = z.array(uuidSchema).safeParse(diaIds)
  if (!idsOk.success) return { success: false, error: "IDs inválidos" }
  const db = await getDb()

  try {
    await db`
      UPDATE dias_trabalhados
      SET pago = true, valor_pago = valor_dia, data_pagamento = CURRENT_DATE
      WHERE trabalhador_id = ${trabalhadorId} AND id = ANY(${diaIds}::uuid[]) AND pago = false
    `
  } catch {
    return { success: false, error: "Erro ao salvar no banco de dados" }
  }

  logAudit("pagar_semana", `Trabalhador: ${trabalhadorId}, Dias: ${diaIds.length}`)
  revalidatePath(`/trabalhadores/${trabalhadorId}`)
  revalidatePath("/")
  return { success: true }
}

export async function deletarDia(id: string): Promise<ActionResult> {
  await requireAuth()
  const idOk = uuidSchema.safeParse(id)
  if (!idOk.success) return { success: false, error: "ID inválido" }
  const db = await getDb()
  const dia = await db`
    SELECT trabalhador_id FROM dias_trabalhados WHERE id = ${id}
  `
  if (!dia[0]) return { success: false, error: "Registro não encontrado" }

  try {
    await db`DELETE FROM dias_trabalhados WHERE id = ${id}`
  } catch {
    return { success: false, error: "Erro ao salvar no banco de dados" }
  }

  logAudit("deletar_dia", `ID: ${id}`)
  revalidatePath(`/trabalhadores/${dia[0].trabalhador_id}`)
  revalidatePath("/")
  return { success: true }
}

export async function listarDias(trabalhadorId: string) {
  await requireAuth()
  const db = await getDb()
  return await db`
    SELECT * FROM dias_trabalhados
    WHERE trabalhador_id = ${trabalhadorId}
    ORDER BY data DESC
  `
}
