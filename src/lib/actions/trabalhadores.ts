"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getDb } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import type { ActionResult } from "./shared"

const criarSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  funcao: z.enum(["pedreiro", "servente"]),
  valor_diaria: z.coerce.number().positive("Valor da diária deve ser positivo"),
})

export async function criarTrabalhador(formData: FormData): Promise<ActionResult> {
  await requireAuth()
  const parsed = criarSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: "Verifique os campos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const db = await getDb()

  await db`
    INSERT INTO trabalhadores (nome, funcao, valor_diaria)
    VALUES (${parsed.data.nome}, ${parsed.data.funcao}, ${parsed.data.valor_diaria})
  `

  logAudit("criar_trabalhador", `Nome: ${parsed.data.nome}`)
  revalidatePath("/trabalhadores")
  revalidatePath("/")
  return { success: true }
}

export async function atualizarTrabalhador(id: string, formData: FormData): Promise<ActionResult> {
  await requireAuth()
  const parsed = criarSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: "Verifique os campos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  const db = await getDb()

  await db`
    UPDATE trabalhadores
    SET nome = ${parsed.data.nome}, funcao = ${parsed.data.funcao}, valor_diaria = ${parsed.data.valor_diaria}
    WHERE id = ${id}
  `

  await db`
    UPDATE dias_trabalhados
    SET valor_dia = CASE WHEN tipo = 'meio' THEN ${parsed.data.valor_diaria} / 2 ELSE ${parsed.data.valor_diaria} END
    WHERE trabalhador_id = ${id}
  `

  logAudit("atualizar_trabalhador", `ID: ${id}, Nome: ${parsed.data.nome}`)
  revalidatePath("/trabalhadores")
  revalidatePath(`/trabalhadores/${id}`)
  revalidatePath("/")
  return { success: true }
}

const uuidSchema = z.string().uuid()

export async function toggleAtivoTrabalhador(id: string, ativo: boolean): Promise<ActionResult> {
  await requireAuth()
  const idOk = uuidSchema.safeParse(id)
  if (!idOk.success) return { success: false, error: "ID inválido" }
  if (typeof ativo !== "boolean") return { success: false, error: "Valor inválido" }
  const db = await getDb()
  await db`
    UPDATE trabalhadores SET ativo = ${ativo} WHERE id = ${id}
  `

  logAudit("toggle_ativo_trabalhador", `ID: ${id}, Ativo: ${ativo}`)
  revalidatePath("/trabalhadores")
  revalidatePath("/")
  return { success: true }
}

export async function deletarTrabalhador(id: string) {
  await requireAuth()
  const idOk = uuidSchema.safeParse(id)
  if (!idOk.success) return
  const db = await getDb()
  await db`DELETE FROM trabalhadores WHERE id = ${id}`
  logAudit("deletar_trabalhador", `ID: ${id}`)
  revalidatePath("/trabalhadores")
  revalidatePath("/")
}

export async function listarTrabalhadores() {
  await requireAuth()
  const db = await getDb()
  const rows = await db`
    SELECT * FROM trabalhadores ORDER BY ativo DESC, nome ASC
  `
  return rows
}

export async function obterTrabalhador(id: string) {
  await requireAuth()
  const db = await getDb()
  const rows = await db`
    SELECT * FROM trabalhadores WHERE id = ${id}
  `
  return rows[0] || null
}
