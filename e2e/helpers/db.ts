import { Pool } from "@neondatabase/serverless"
import * as fs from "fs"
import * as path from "path"

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL environment variable is not set")
    pool = new Pool({ connectionString: url })
  }
  return pool
}

export async function seedTestDatabase(): Promise<void> {
  const p = getPool()
  const schemaPath = path.join(__dirname, "..", "..", "sql", "schema.sql")
  const schema = fs.readFileSync(schemaPath, "utf-8")
  await p.query(schema)
}

const TRUNCATE_TABLES = [
  "rate_limits",
  "audit_log",
  "dias_trabalhados",
  "despesas",
  "trabalhadores",
]

export async function cleanTestDatabase(): Promise<void> {
  const p = getPool()
  await p.query(`TRUNCATE TABLE ${TRUNCATE_TABLES.join(", ")} CASCADE`)
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
