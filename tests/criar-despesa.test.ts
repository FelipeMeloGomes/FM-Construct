import { describe, it, expect, beforeEach, vi } from "vitest"

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

const makeFormData = (overrides: Record<string, string> = {}) => {
  const fd = new FormData()
  fd.set("descricao", overrides.descricao ?? "Cimento 50kg")
  fd.set("categoria", overrides.categoria ?? "material")
  fd.set("valor", overrides.valor ?? "85.50")
  fd.set("data", overrides.data ?? "2024-06-01")
  return fd
}

describe("criarDespesa", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("cria despesa com dados válidos", async () => {
    mockInsert.mockResolvedValueOnce(undefined)

    const result = await criarDespesa(makeFormData())

    expect(result.success).toBe(true)
    expect(mockInsert).toHaveBeenCalledOnce()
  })

  it("retorna erro quando descrição tem menos de 3 caracteres", async () => {
    const result = await criarDespesa(makeFormData({ descricao: "ab" }))

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor é zero", async () => {
    const result = await criarDespesa(makeFormData({ valor: "0" }))

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor é negativo", async () => {
    const result = await criarDespesa(makeFormData({ valor: "-10" }))

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando categoria é inválida", async () => {
    const result = await criarDespesa(makeFormData({ categoria: "inexistente" }))

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
