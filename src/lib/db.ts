type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>

let sql: SqlTag | null = null

export async function getDb(): Promise<SqlTag> {
  if (!sql) {
    const { neon } = await import("@neondatabase/serverless")
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    sql = neon(url) as unknown as SqlTag
  }
  return sql
}

export default getDb
