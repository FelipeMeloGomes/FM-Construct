"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getDb } from "@/lib/db"

const criarDespesaSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  categoria: z.enum(["material", "alimentacao", "transporte", "ferramentas", "outros"]),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  data: z.string().min(1, "Selecione a data"),
  pago_para: z.string().optional(),
  observacao: z.string().optional(),
})

export async function criarDespesa(formData: FormData) {
  const parsed = criarDespesaSchema.parse(Object.fromEntries(formData))
  const db = await getDb()

  await db`
    INSERT INTO despesas (descricao, categoria, valor, data, pago_para, observacao)
    VALUES (${parsed.descricao}, ${parsed.categoria}, ${parsed.valor}, ${parsed.data}, ${parsed.pago_para || null}, ${parsed.observacao || null})
  `

  revalidatePath("/despesas")
  revalidatePath("/")
}

export async function deletarDespesa(id: string) {
  const db = await getDb()
  await db`DELETE FROM despesas WHERE id = ${id}`
  revalidatePath("/despesas")
  revalidatePath("/")
}

export async function atualizarDespesa(id: string, formData: FormData) {
  const parsed = criarDespesaSchema.parse(Object.fromEntries(formData))
  const db = await getDb()
  await db`
    UPDATE despesas
    SET descricao = ${parsed.descricao}, categoria = ${parsed.categoria}, valor = ${parsed.valor}, data = ${parsed.data}, pago_para = ${parsed.pago_para || null}, observacao = ${parsed.observacao || null}
    WHERE id = ${id}
  `
  revalidatePath("/despesas")
  revalidatePath("/")
}

export async function listarDespesas() {
  const db = await getDb()
  const rows = await db`
    SELECT * FROM despesas ORDER BY data DESC, created_at DESC
  `
  return rows
}
