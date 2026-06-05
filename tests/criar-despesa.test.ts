import { describe, it, expect, beforeEach, vi } from "vitest"
import { assertIsError, makeFormData } from "../tests/test-utils"

const mockInsert = vi.fn()
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => {
    const fn = (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.reduce((acc, s, i) => acc + s + (values[i] !== undefined ? `$${i + 1}` : ""), "")
      if (sql.includes("INSERT INTO despesas")) return mockInsert()
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

import { criarDespesa } from "@/lib/actions/despesas"

const defaults = { descricao: "Cimento 50kg", categoria: "material", valor: "85.50", data: "2024-06-01" }

describe("criarDespesa", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("cria despesa com dados válidos", async () => {
    mockInsert.mockResolvedValueOnce(undefined)

    const result = await criarDespesa(makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mockInsert).toHaveBeenCalledOnce()
  })

  it("retorna erro quando descrição tem menos de 3 caracteres", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, descricao: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.descricao).toBeDefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor é zero", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, valor: "0" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor).toBeDefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor é negativo", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, valor: "-10" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor).toBeDefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando categoria é inválida", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, categoria: "inexistente" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.categoria).toBeDefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
