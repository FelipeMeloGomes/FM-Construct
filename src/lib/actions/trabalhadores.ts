"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getDb } from "@/lib/db"

const criarSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  funcao: z.enum(["pedreiro", "servente"]),
  valor_diaria: z.coerce.number().positive("Valor da diária deve ser positivo"),
})

export async function criarTrabalhador(formData: FormData) {
  const parsed = criarSchema.parse(Object.fromEntries(formData))
  const db = await getDb()

  await db`
    INSERT INTO trabalhadores (nome, funcao, valor_diaria)
    VALUES (${parsed.nome}, ${parsed.funcao}, ${parsed.valor_diaria})
  `

  revalidatePath("/trabalhadores")
  revalidatePath("/")
}

export async function atualizarTrabalhador(id: string, formData: FormData) {
  const parsed = criarSchema.parse(Object.fromEntries(formData))
  const db = await getDb()

  await db`
    UPDATE trabalhadores
    SET nome = ${parsed.nome}, funcao = ${parsed.funcao}, valor_diaria = ${parsed.valor_diaria}
    WHERE id = ${id}
  `

  revalidatePath("/trabalhadores")
  revalidatePath(`/trabalhadores/${id}`)
  revalidatePath("/")
}

export async function toggleAtivoTrabalhador(id: string, ativo: boolean) {
  const db = await getDb()
  await db`
    UPDATE trabalhadores SET ativo = ${ativo} WHERE id = ${id}
  `

  revalidatePath("/trabalhadores")
  revalidatePath("/")
}

export async function deletarTrabalhador(id: string) {
  const db = await getDb()
  await db`DELETE FROM trabalhadores WHERE id = ${id}`
  revalidatePath("/trabalhadores")
  revalidatePath("/")
}

export async function listarTrabalhadores() {
  const db = await getDb()
  const rows = await db`
    SELECT * FROM trabalhadores ORDER BY ativo DESC, nome ASC
  `
  return rows
}

export async function obterTrabalhador(id: string) {
  const db = await getDb()
  const rows = await db`
    SELECT * FROM trabalhadores WHERE id = ${id}
  `
  return rows[0] || null
}
