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

export async function insertManyTrabalhadores(count: number): Promise<void> {
  const p = getPool()
  for (let i = 0; i < count; i++) {
    const nome = `Trabalhador ${String(i + 1).padStart(2, "0")}`
    const funcao = i % 2 === 0 ? "pedreiro" : "servente"
    const valor = 150 + i * 10
    await p.query(
      `INSERT INTO trabalhadores (id, nome, funcao, valor_diaria, ativo, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())`,
      [nome, funcao, valor],
    )
  }
}

export async function insertManyDespesas(count: number): Promise<void> {
  const p = getPool()
  const CATEGORIAS = ["material", "alimentacao", "transporte", "ferramentas", "outros"]
  for (let i = 0; i < count; i++) {
    const descricao = `Despesa ${String(i + 1).padStart(2, "0")}`
    await p.query(
      `INSERT INTO despesas (id, descricao, categoria, valor, data, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_DATE, NOW())`,
      [descricao, CATEGORIAS[i % CATEGORIAS.length], 50 + i * 10],
    )
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
