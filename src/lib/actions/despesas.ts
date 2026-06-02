"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getDb } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import type { ActionResult } from "./shared"

const criarDespesaSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  categoria: z.enum(["material", "alimentacao", "transporte", "ferramentas", "outros"]),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  data: z.string().min(1, "Selecione a data"),
  pago_para: z.string().optional(),
  observacao: z.string().optional(),
})

export async function criarDespesa(formData: FormData): Promise<ActionResult> {
  await requireAuth()
  const parsed = criarDespesaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: "Verifique os campos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const db = await getDb()

  await db`
    INSERT INTO despesas (descricao, categoria, valor, data, pago_para, observacao)
    VALUES (${parsed.data.descricao}, ${parsed.data.categoria}, ${parsed.data.valor}, ${parsed.data.data}, ${parsed.data.pago_para || null}, ${parsed.data.observacao || null})
  `

  logAudit("criar_despesa", `Descrição: ${parsed.data.descricao}, Valor: ${parsed.data.valor}`)
  revalidatePath("/despesas")
  revalidatePath("/")
  return { success: true }
}

const uuidSchema = z.string().uuid()

export async function deletarDespesa(id: string): Promise<ActionResult> {
  await requireAuth()
  const idOk = uuidSchema.safeParse(id)
  if (!idOk.success) return { success: false, error: "ID inválido" }
  const db = await getDb()
  await db`DELETE FROM despesas WHERE id = ${id}`
  logAudit("deletar_despesa", `ID: ${id}`)
  revalidatePath("/despesas")
  revalidatePath("/")
  return { success: true }
}

export async function deletarDespesas(ids: string[]): Promise<ActionResult> {
  await requireAuth()
  if (ids.length === 0) return { success: false, error: "Nenhuma despesa selecionada" }
  const db = await getDb()
  await db`DELETE FROM despesas WHERE id = ANY(${ids})`
  logAudit("deletar_despesas", `${ids.length} despesas`)
  revalidatePath("/despesas")
  revalidatePath("/")
  return { success: true }
}

export async function atualizarDespesa(id: string, formData: FormData): Promise<ActionResult> {
  await requireAuth()
  const parsed = criarDespesaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: "Verifique os campos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const db = await getDb()
  await db`
    UPDATE despesas
    SET descricao = ${parsed.data.descricao}, categoria = ${parsed.data.categoria}, valor = ${parsed.data.valor}, data = ${parsed.data.data}, pago_para = ${parsed.data.pago_para || null}, observacao = ${parsed.data.observacao || null}
    WHERE id = ${id}
  `
  logAudit("atualizar_despesa", `ID: ${id}`)
  revalidatePath("/despesas")
  revalidatePath("/")
  return { success: true }
}

export async function listarDespesas() {
  await requireAuth()
  const db = await getDb()
  const rows = await db`
    SELECT * FROM despesas ORDER BY data DESC, created_at DESC
  `
  return rows
}
