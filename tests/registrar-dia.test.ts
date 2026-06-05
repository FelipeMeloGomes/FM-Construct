import { describe, it, expect, beforeEach, vi } from "vitest"
import { assertIsError, makeFormData } from "../tests/test-utils"

let shouldThrowDuplicate = false
const mockQuery = vi.fn()
class DbError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => {
    const fn = (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.reduce((acc, s, i) => acc + s + (values[i] !== undefined ? `$${i + 1}` : ""), "")

      if (sql.includes("SELECT valor_diaria, nome FROM trabalhadores")) {
        return [{ valor_diaria: 200, nome: "João" }]
      }

      if (sql.includes("INSERT INTO dias_trabalhados")) {
        if (shouldThrowDuplicate) {
          throw new DbError("duplicate key", "23505")
        }
        return mockQuery()
      }

      return []
    }
    return fn
  }),
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(async () => {}),
}))

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { registrarDia } from "@/lib/actions/dias"

const defaults = {
  trabalhador_id: "550e8400-e29b-41d4-a716-446655440000",
  data: "2024-06-15",
  tipo: "inteiro",
}

describe("registrarDia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shouldThrowDuplicate = false
  })

  it("registra dia com dados válidos", async () => {
    mockQuery.mockResolvedValueOnce(undefined)

    const result = await registrarDia(makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mockQuery).toHaveBeenCalledOnce()
  })

  it("registra meio-dia com sucesso", async () => {
    mockQuery.mockResolvedValueOnce(undefined)

    const result = await registrarDia(makeFormData({ ...defaults, tipo: "meio" }))

    expect(result.success).toBe(true)
  })

  it("retorna erro para data vazia", async () => {
    const result = await registrarDia(makeFormData({ ...defaults, data: "" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.data).toBeDefined()
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it("retorna erro para tipo inválido", async () => {
    const result = await registrarDia(makeFormData({ ...defaults, tipo: "triplo" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.tipo).toBeDefined()
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it("retorna erro amigável para dia duplicado (código 23505)", async () => {
    shouldThrowDuplicate = true

    const result = await registrarDia(makeFormData(defaults))
    assertIsError(result)

    expect(result.error).toContain("já tem registro no dia")
  })
})
