import { getDb } from "@/lib/db"

export type SqlRow = Record<string, unknown>

export async function sqlQuery(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SqlRow[]> {
  const db = await getDb()
  return db(strings, ...values)
}

export function formatarData(data: string | Date): string {
  return new Date(data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
}

export function formatarMes(mes: string | null): string {
  if (!mes) return ""
  const label = new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
  return ` - ${label.charAt(0).toUpperCase() + label.slice(1)}`
}
