import { describe, it, expect, beforeEach, vi } from "vitest"
import { assertIsError, makeFormData, DbError } from "../tests/test-utils"

const { mocks, state } = vi.hoisted(() => ({
  mocks: {
    insert: vi.fn(),
    update: vi.fn(),
    toggleAtivo: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    selectAll: vi.fn(),
    selectOne: vi.fn(),
  },
  state: {
    dbGenericError: false,
  },
}))

function resetState() {
  state.dbGenericError = false
}

vi.mock("@/lib/db", async () => {
  const { sqlTagMock } = await import("../tests/test-utils")
  return {
    getDb: vi.fn(async () => sqlTagMock({
      "SELECT * FROM trabalhadores ORDER BY": () => mocks.selectAll(),
      "SELECT * FROM trabalhadores WHERE": () => mocks.selectOne(),
      "INSERT INTO trabalhadores": () => {
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        return mocks.insert()
      },
      "SET nome": () => {
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        return mocks.update()
      },
      "SET ativo": () => {
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        return mocks.toggleAtivo()
      },
      "DELETE FROM trabalhadores WHERE id = $": () => {
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        return mocks.deleteOne()
      },
      "ANY($": () => {
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        return mocks.deleteMany()
      },
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

import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { criarTrabalhador, atualizarTrabalhador, toggleAtivoTrabalhador, deletarTrabalhador, deletarTrabalhadores, listarTrabalhadores, obterTrabalhador } from "@/lib/actions/trabalhadores"

const defaults = { nome: "João Pedreiro", funcao: "pedreiro", valor_diaria: "200" }

describe("criarTrabalhador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("cria trabalhador com dados válidos", async () => {
    mocks.insert.mockResolvedValueOnce(undefined)

    const result = await criarTrabalhador(makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mocks.insert).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("criar_trabalhador", "Nome: João Pedreiro")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(criarTrabalhador(makeFormData(defaults))).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando nome tem menos de 3 caracteres", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, nome: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.nome?.[0]).toBe("Nome deve ter no mínimo 3 caracteres")
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando função é inválida", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, funcao: "encanador" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.funcao?.[0]).toBe("Invalid option: expected one of \"pedreiro\"|\"servente\"")
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor da diária é negativo", async () => {
    const result = await criarTrabalhador(makeFormData({ ...defaults, valor_diaria: "-50" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor_diaria?.[0]).toBe("Valor da diária deve ser positivo")
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await criarTrabalhador(makeFormData(defaults))
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("atualizarTrabalhador", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000"

  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("atualiza trabalhador com dados válidos", async () => {
    mocks.update.mockResolvedValueOnce(undefined)

    const result = await atualizarTrabalhador(id, makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mocks.update).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("atualizar_trabalhador", "ID: 550e8400-e29b-41d4-a716-446655440000, Nome: João Pedreiro")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(atualizarTrabalhador(id, makeFormData(defaults))).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando nome tem menos de 3 caracteres", async () => {
    const result = await atualizarTrabalhador(id, makeFormData({ ...defaults, nome: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.nome?.[0]).toBe("Nome deve ter no mínimo 3 caracteres")
    expect(mocks.update).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await atualizarTrabalhador("invalido", makeFormData(defaults))
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.update).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await atualizarTrabalhador(id, makeFormData(defaults))
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("toggleAtivoTrabalhador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("ativa trabalhador com sucesso", async () => {
    mocks.toggleAtivo.mockResolvedValueOnce(undefined)

    const result = await toggleAtivoTrabalhador("550e8400-e29b-41d4-a716-446655440000", true)

    expect(result.success).toBe(true)
    expect(mocks.toggleAtivo).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("toggle_ativo_trabalhador", "ID: 550e8400-e29b-41d4-a716-446655440000, Ativo: true")
  })

  it("desativa trabalhador com sucesso", async () => {
    mocks.toggleAtivo.mockResolvedValueOnce(undefined)

    const result = await toggleAtivoTrabalhador("550e8400-e29b-41d4-a716-446655440000", false)

    expect(result.success).toBe(true)
    expect(mocks.toggleAtivo).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("toggle_ativo_trabalhador", "ID: 550e8400-e29b-41d4-a716-446655440000, Ativo: false")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(toggleAtivoTrabalhador("550e8400-e29b-41d4-a716-446655440000", true)).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await toggleAtivoTrabalhador("invalido", true)
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.toggleAtivo).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await toggleAtivoTrabalhador("550e8400-e29b-41d4-a716-446655440000", true)
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("deletarTrabalhador", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("deleta trabalhador com sucesso", async () => {
    mocks.deleteOne.mockResolvedValueOnce(undefined)

    const result = await deletarTrabalhador("550e8400-e29b-41d4-a716-446655440000")

    expect(result.success).toBe(true)
    expect(mocks.deleteOne).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("deletar_trabalhador", "ID: 550e8400-e29b-41d4-a716-446655440000")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(deletarTrabalhador("550e8400-e29b-41d4-a716-446655440000")).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await deletarTrabalhador("invalido")
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.deleteOne).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await deletarTrabalhador("550e8400-e29b-41d4-a716-446655440000")
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("deletarTrabalhadores", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("deleta múltiplos trabalhadores com sucesso", async () => {
    mocks.deleteMany.mockResolvedValueOnce(undefined)

    const result = await deletarTrabalhadores(["550e8400-e29b-41d4-a716-446655440000"])

    expect(result.success).toBe(true)
    expect(mocks.deleteMany).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("deletar_trabalhadores", "1 trabalhadores")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(deletarTrabalhadores(["550e8400-e29b-41d4-a716-446655440000"])).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando array está vazio", async () => {
    const result = await deletarTrabalhadores([])
    assertIsError(result)

    expect(result.error).toBe("Nenhum trabalhador selecionado")
    expect(mocks.deleteMany).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await deletarTrabalhadores(["550e8400-e29b-41d4-a716-446655440000"])
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("listarTrabalhadores", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna lista de trabalhadores", async () => {
    const trabalhadoresMock = [{ id: "1", nome: "João", funcao: "pedreiro" }]
    mocks.selectAll.mockResolvedValueOnce(trabalhadoresMock)

    const result = await listarTrabalhadores()

    expect(result).toEqual(trabalhadoresMock)
    expect(mocks.selectAll).toHaveBeenCalledOnce()
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(listarTrabalhadores()).rejects.toThrow("NEXT_REDIRECT")
  })
})

describe("obterTrabalhador", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna trabalhador pelo ID", async () => {
    const trabalhadorMock = { id, nome: "João", funcao: "pedreiro" }
    mocks.selectOne.mockResolvedValueOnce([trabalhadorMock])

    const result = await obterTrabalhador(id)

    expect(result).toEqual(trabalhadorMock)
    expect(mocks.selectOne).toHaveBeenCalledOnce()
  })

  it("retorna null quando trabalhador não existe", async () => {
    mocks.selectOne.mockResolvedValueOnce([])

    const result = await obterTrabalhador(id)

    expect(result).toBeNull()
    expect(mocks.selectOne).toHaveBeenCalledOnce()
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(obterTrabalhador(id)).rejects.toThrow("NEXT_REDIRECT")
  })
})
