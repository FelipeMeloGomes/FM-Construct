import { describe, it, expect, beforeEach, vi } from "vitest"
import { assertIsError, makeFormData } from "../tests/test-utils"

const mockInsert = vi.fn()
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => {
    const fn = (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.reduce((acc, s, i) => acc + s + (values[i] !== undefined ? `$${i + 1}` : ""), "")
      if (sql.includes("INSERT INTO trabalhadores")) return mockInsert()
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

import { criarTrabalhador } from "@/lib/actions/trabalhadores"

const defaults = { nome: "João Pedreiro", funcao: "pedreiro", valor_diaria: "200" }

describe("criarTrabalhador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("cria trabalhador com dados válidos", async () => {
    mockInsert.mockResolvedValueOnce(undefined)

    const result = await criarTrabalhador(makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mockInsert).toHaveBeenCalledOnce()
  })

  it("retorna erro quando nome tem menos de 3 caracteres", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, nome: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.nome).toBeDefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando função é inválida", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, funcao: "encanador" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.funcao).toBeDefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor da diária é negativo", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, valor_diaria: "-50" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor_diaria).toBeDefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
