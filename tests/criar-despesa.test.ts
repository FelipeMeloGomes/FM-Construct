import { describe, it, expect, beforeEach, vi } from "vitest"
import { assertIsError, makeFormData } from "../tests/test-utils"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    insert: vi.fn(),
    update: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock("@/lib/db", async () => {
  const { sqlTagMock } = await import("../tests/test-utils")
  return {
    getDb: vi.fn(async () => sqlTagMock({
      "INSERT INTO despesas": () => mocks.insert(),
      "UPDATE despesas": () => mocks.update(),
      "DELETE FROM despesas WHERE id = $": () => mocks.deleteOne(),
      "ANY($": () => mocks.deleteMany(),
    })),
  }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(async () => {}),
}))

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { criarDespesa, atualizarDespesa, deletarDespesa, deletarDespesas } from "@/lib/actions/despesas"

const defaults = { descricao: "Cimento 50kg", categoria: "material", valor: "85.50", data: "2024-06-01" }

describe("criarDespesa", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("cria despesa com dados válidos", async () => {
    mocks.insert.mockResolvedValueOnce(undefined)

    const result = await criarDespesa(makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mocks.insert).toHaveBeenCalledOnce()
  })

  it("retorna erro quando descrição tem menos de 3 caracteres", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, descricao: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.descricao).toBeDefined()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor é zero", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, valor: "0" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor).toBeDefined()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor é negativo", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, valor: "-10" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor).toBeDefined()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("retorna erro quando categoria é inválida", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, categoria: "inexistente" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.categoria).toBeDefined()
    expect(mocks.insert).not.toHaveBeenCalled()
  })
})

describe("atualizarDespesa", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("atualiza despesa com dados válidos", async () => {
    mocks.update.mockResolvedValueOnce(undefined)

    const result = await atualizarDespesa(id, makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mocks.update).toHaveBeenCalledOnce()
  })

  it("retorna erro quando descrição tem menos de 3 caracteres", async () => {
    const result = await atualizarDespesa(id, makeFormData({ ...defaults, descricao: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.descricao).toBeDefined()
    expect(mocks.update).not.toHaveBeenCalled()
  })
})

describe("deletarDespesa", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deleta despesa com sucesso", async () => {
    mocks.deleteOne.mockResolvedValueOnce(undefined)

    const result = await deletarDespesa("550e8400-e29b-41d4-a716-446655440000")

    expect(result.success).toBe(true)
    expect(mocks.deleteOne).toHaveBeenCalledOnce()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await deletarDespesa("invalido")
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.deleteOne).not.toHaveBeenCalled()
  })
})

describe("deletarDespesas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deleta múltiplas despesas com sucesso", async () => {
    mocks.deleteMany.mockResolvedValueOnce(undefined)

    const result = await deletarDespesas(["550e8400-e29b-41d4-a716-446655440000"])

    expect(result.success).toBe(true)
    expect(mocks.deleteMany).toHaveBeenCalledOnce()
  })

  it("retorna erro quando array está vazio", async () => {
    const result = await deletarDespesas([])
    assertIsError(result)

    expect(result.error).toBe("Nenhuma despesa selecionada")
    expect(mocks.deleteMany).not.toHaveBeenCalled()
  })
})
