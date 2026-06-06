type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>

let sql: SqlTag | null = null

const RETRIES = 3

async function retry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < RETRIES; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === RETRIES - 1) throw err
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
    }
  }
  throw new Error("Unreachable")
}

export async function getDb(): Promise<SqlTag> {
  if (!sql) {
    const { neon } = await import("@neondatabase/serverless")
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL not set")
    sql = neon(url) as unknown as SqlTag
  }
  return async (strings, ...values) => retry(() => sql!(strings, ...values))
}

export default getDb
