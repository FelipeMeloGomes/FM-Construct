import { describe, it, expect, beforeEach, vi } from "vitest"
import { assertIsError, makeFormData } from "../tests/test-utils"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    insert: vi.fn(),
    update: vi.fn(),
    toggleAtivo: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock("@/lib/db", async () => {
  const { sqlTagMock } = await import("../tests/test-utils")
  return {
    getDb: vi.fn(async () => sqlTagMock({
      "INSERT INTO trabalhadores": () => mocks.insert(),
      "SET nome": () => mocks.update(),
      "SET ativo": () => mocks.toggleAtivo(),
      "DELETE FROM trabalhadores WHERE id = $": () => mocks.deleteOne(),
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

import { criarTrabalhador, atualizarTrabalhador, toggleAtivoTrabalhador, deletarTrabalhador, deletarTrabalhadores } from "@/lib/actions/trabalhadores"

const defaults = { nome: "João Pedreiro", funcao: "pedreiro", valor_diaria: "200" }

describe("criarTrabalhador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("cria trabalhador com dados válidos", async () => {
    mocks.insert.mockResolvedValueOnce(undefined)

    const result = await criarTrabalhador(makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mocks.insert).toHaveBeenCalledOnce()
  })

  it("retorna erro quando nome tem menos de 3 caracteres", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, nome: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.nome).toBeDefined()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("retorna erro quando função é inválida", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, funcao: "encanador" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.funcao).toBeDefined()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor da diária é negativo", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, valor_diaria: "-50" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor_diaria).toBeDefined()
    expect(mocks.insert).not.toHaveBeenCalled()
  })
})

describe("atualizarTrabalhador", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("atualiza trabalhador com dados válidos", async () => {
    mocks.update.mockResolvedValueOnce(undefined)

    const result = await atualizarTrabalhador(id, makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mocks.update).toHaveBeenCalledOnce()
  })

  it("retorna erro quando nome tem menos de 3 caracteres", async () => {
    const result = await atualizarTrabalhador(id, makeFormData({ ...defaults, nome: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.nome).toBeDefined()
    expect(mocks.update).not.toHaveBeenCalled()
  })
})

describe("toggleAtivoTrabalhador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("ativa trabalhador com sucesso", async () => {
    mocks.toggleAtivo.mockResolvedValueOnce(undefined)

    const result = await toggleAtivoTrabalhador("550e8400-e29b-41d4-a716-446655440000", true)

    expect(result.success).toBe(true)
    expect(mocks.toggleAtivo).toHaveBeenCalledOnce()
  })

  it("desativa trabalhador com sucesso", async () => {
    mocks.toggleAtivo.mockResolvedValueOnce(undefined)

    const result = await toggleAtivoTrabalhador("550e8400-e29b-41d4-a716-446655440000", false)

    expect(result.success).toBe(true)
    expect(mocks.toggleAtivo).toHaveBeenCalledOnce()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await toggleAtivoTrabalhador("invalido", true)
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.toggleAtivo).not.toHaveBeenCalled()
  })
})

describe("deletarTrabalhador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deleta trabalhador com sucesso", async () => {
    mocks.deleteOne.mockResolvedValueOnce(undefined)

    const result = await deletarTrabalhador("550e8400-e29b-41d4-a716-446655440000")

    expect(result.success).toBe(true)
    expect(mocks.deleteOne).toHaveBeenCalledOnce()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await deletarTrabalhador("invalido")
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.deleteOne).not.toHaveBeenCalled()
  })
})

describe("deletarTrabalhadores", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deleta múltiplos trabalhadores com sucesso", async () => {
    mocks.deleteMany.mockResolvedValueOnce(undefined)

    const result = await deletarTrabalhadores(["550e8400-e29b-41d4-a716-446655440000"])

    expect(result.success).toBe(true)
    expect(mocks.deleteMany).toHaveBeenCalledOnce()
  })

  it("retorna erro quando array está vazio", async () => {
    const result = await deletarTrabalhadores([])
    assertIsError(result)

    expect(result.error).toBe("Nenhum trabalhador selecionado")
    expect(mocks.deleteMany).not.toHaveBeenCalled()
  })
})
