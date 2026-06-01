import { describe, it, expect, beforeEach, vi } from "vitest"

const mockInsert = vi.fn()
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(async () => {
    const fn = (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.reduce((acc, s, i) => acc + s + (values[i] !== undefined ? `$${i + 1}` : ""), "")
      if (sql.includes("INSERT INTO trabalhadores")) return mockInsert()
      return []
    }
    fn.append = vi.fn()
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

const makeFormData = (overrides: Record<string, string> = {}) => {
  const fd = new FormData()
  fd.set("nome", overrides.nome ?? "João Pedreiro")
  fd.set("funcao", overrides.funcao ?? "pedreiro")
  fd.set("valor_diaria", overrides.valor_diaria ?? "200")
  return fd
}

describe("criarTrabalhador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("cria trabalhador com dados válidos", async () => {
    mockInsert.mockResolvedValueOnce(undefined)

    const result = await criarTrabalhador(makeFormData())

    expect(result.success).toBe(true)
    expect(mockInsert).toHaveBeenCalledOnce()
  })

  it("retorna erro quando nome tem menos de 3 caracteres", async () => {
    const result = await criarTrabalhador(makeFormData({ nome: "ab" }))

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando função é inválida", async () => {
    const result = await criarTrabalhador(makeFormData({ funcao: "encanador" }))

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor da diária é negativo", async () => {
    const result = await criarTrabalhador(makeFormData({ valor_diaria: "-50" }))

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
