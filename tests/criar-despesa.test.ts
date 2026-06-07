import { describe, it, expect, beforeEach, vi } from "vitest"
import { assertIsError, makeFormData, DbError } from "../tests/test-utils"

const { mocks, state } = vi.hoisted(() => ({
  mocks: {
    insert: vi.fn(),
    update: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    selectAll: vi.fn(),
  },
  state: {
    dbGenericError: false,
    shouldThrowDuplicate: false,
  },
}))

function resetState() {
  state.dbGenericError = false
  state.shouldThrowDuplicate = false
}

vi.mock("@/lib/db", async () => {
  const { sqlTagMock } = await import("../tests/test-utils")
  return {
    getDb: vi.fn(async () => sqlTagMock({
      "SELECT * FROM despesas ORDER BY": () => mocks.selectAll(),
      "INSERT INTO despesas": () => {
        if (state.shouldThrowDuplicate) throw new DbError("duplicate key", "23505")
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        return mocks.insert()
      },
      "UPDATE despesas": () => {
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        return mocks.update()
      },
      "DELETE FROM despesas WHERE id = $": () => {
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
import { criarDespesa, atualizarDespesa, deletarDespesa, deletarDespesas, listarDespesas } from "@/lib/actions/despesas"

const defaults = { descricao: "Cimento 50kg", categoria: "material", valor: "85.50", data: "2024-06-01" }

describe("criarDespesa", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("cria despesa com dados válidos", async () => {
    mocks.insert.mockResolvedValueOnce(undefined)

    const result = await criarDespesa(makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mocks.insert).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("criar_despesa", "Descrição: Cimento 50kg, Valor: 85.5")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(criarDespesa(makeFormData(defaults))).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando descrição tem menos de 3 caracteres", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, descricao: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.descricao?.[0]).toBe("Descrição deve ter no mínimo 3 caracteres")
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor é zero", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, valor: "0" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor?.[0]).toBe("Valor deve ser positivo")
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando valor é negativo", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, valor: "-10" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor?.[0]).toBe("Valor deve ser positivo")
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando categoria é inválida", async () => {
    const result = await criarDespesa(makeFormData({ ...defaults, categoria: "inexistente" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.categoria?.[0]).toBe("Invalid option: expected one of \"material\"|\"alimentacao\"|\"transporte\"|\"ferramentas\"|\"outros\"")
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await criarDespesa(makeFormData(defaults))
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro amigável para despesa duplicada (código 23505)", async () => {
    state.shouldThrowDuplicate = true

    const result = await criarDespesa(makeFormData(defaults))
    assertIsError(result)

    expect(result.error).toContain("duplicada")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("atualizarDespesa", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000"

  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("atualiza despesa com dados válidos", async () => {
    mocks.update.mockResolvedValueOnce(undefined)

    const result = await atualizarDespesa(id, makeFormData(defaults))

    expect(result.success).toBe(true)
    expect(mocks.update).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("atualizar_despesa", "ID: 550e8400-e29b-41d4-a716-446655440000")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(atualizarDespesa(id, makeFormData(defaults))).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando descrição tem menos de 3 caracteres", async () => {
    const result = await atualizarDespesa(id, makeFormData({ ...defaults, descricao: "ab" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.descricao?.[0]).toBe("Descrição deve ter no mínimo 3 caracteres")
    expect(mocks.update).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await atualizarDespesa("invalido", makeFormData(defaults))
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.update).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await atualizarDespesa(id, makeFormData(defaults))
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("deletarDespesa", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("deleta despesa com sucesso", async () => {
    mocks.deleteOne.mockResolvedValueOnce(undefined)

    const result = await deletarDespesa("550e8400-e29b-41d4-a716-446655440000")

    expect(result.success).toBe(true)
    expect(mocks.deleteOne).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("deletar_despesa", "ID: 550e8400-e29b-41d4-a716-446655440000")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(deletarDespesa("550e8400-e29b-41d4-a716-446655440000")).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await deletarDespesa("invalido")
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.deleteOne).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await deletarDespesa("550e8400-e29b-41d4-a716-446655440000")
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("deletarDespesas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("deleta múltiplas despesas com sucesso", async () => {
    mocks.deleteMany.mockResolvedValueOnce(undefined)

    const result = await deletarDespesas(["550e8400-e29b-41d4-a716-446655440000"])

    expect(result.success).toBe(true)
    expect(mocks.deleteMany).toHaveBeenCalledOnce()
    expect(logAudit).toHaveBeenCalledWith("deletar_despesas", "1 despesas")
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(deletarDespesas(["550e8400-e29b-41d4-a716-446655440000"])).rejects.toThrow("NEXT_REDIRECT")
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro quando array está vazio", async () => {
    const result = await deletarDespesas([])
    assertIsError(result)

    expect(result.error).toBe("Nenhuma despesa selecionada")
    expect(mocks.deleteMany).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await deletarDespesas(["550e8400-e29b-41d4-a716-446655440000"])
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
    expect(logAudit).not.toHaveBeenCalled()
  })
})

describe("listarDespesas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna lista de despesas", async () => {
    const despesasMock = [{ id: "1", descricao: "Cimento", valor: 85.5 }]
    mocks.selectAll.mockResolvedValueOnce(despesasMock)

    const result = await listarDespesas()

    expect(result).toEqual(despesasMock)
    expect(mocks.selectAll).toHaveBeenCalledOnce()
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(listarDespesas()).rejects.toThrow("NEXT_REDIRECT")
  })
})
