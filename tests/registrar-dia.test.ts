import { describe, it, expect, beforeEach, vi } from "vitest"
import { assertIsError, makeFormData } from "../tests/test-utils"

const { mocks, state } = vi.hoisted(() => ({
  mocks: {
    insert: vi.fn(),
    update: vi.fn(),
    deleteOne: vi.fn(),
    selectAll: vi.fn(),
  },
  state: {
    shouldThrowDuplicate: false,
    trabalhadorNotFound: false,
    selectNotFound: false,
    joinNotFound: false,
    dbGenericError: false,
  },
}))

vi.mock("@/lib/db", async () => {
  const { sqlTagMock, DbError } = await import("../tests/test-utils")
  return {
    getDb: vi.fn(async () => sqlTagMock({
      "SELECT * FROM dias_trabalhados": () => mocks.selectAll(),
      "SELECT valor_diaria, nome FROM trabalhadores": () => {
        if (state.trabalhadorNotFound) return []
        return [{ valor_diaria: 200, nome: "João" }]
      },
      "SELECT trabalhador_id FROM dias_trabalhados": () => {
        if (state.selectNotFound) return []
        return [{ trabalhador_id: "550e8400-e29b-41d4-a716-446655440000" }]
      },
      "t.valor_diaria, d.pago, t.nome": () => {
        if (state.joinNotFound) return []
        return [{ trabalhador_id: "550e8400-e29b-41d4-a716-446655440000", valor_diaria: 200, pago: false, nome: "João" }]
      },
      "INSERT INTO dias_trabalhados": () => {
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        if (state.shouldThrowDuplicate) throw new DbError("duplicate key", "23505")
        return mocks.insert()
      },
      "UPDATE dias_trabalhados": () => {
        if (state.dbGenericError) throw new DbError("connection error", "08001")
        return mocks.update()
      },
      "DELETE FROM dias_trabalhados WHERE id = $": () => mocks.deleteOne(),
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
import { registrarDia, registrarPagamentoDia, pagarSemana, deletarDia, atualizarDia, listarDias } from "@/lib/actions/dias"

function resetState() {
  state.shouldThrowDuplicate = false
  state.trabalhadorNotFound = false
  state.selectNotFound = false
  state.joinNotFound = false
  state.dbGenericError = false
}

const diaDefaults = {
  trabalhador_id: "550e8400-e29b-41d4-a716-446655440000",
  data: "2024-06-15",
  tipo: "inteiro",
}

describe("registrarDia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("registra dia com dados válidos", async () => {
    mocks.insert.mockResolvedValueOnce(undefined)

    const result = await registrarDia(makeFormData(diaDefaults))

    expect(result.success).toBe(true)
    expect(mocks.insert).toHaveBeenCalledOnce()
  })

  it("registra meio-dia com sucesso", async () => {
    mocks.insert.mockResolvedValueOnce(undefined)

    const result = await registrarDia(makeFormData({ ...diaDefaults, tipo: "meio" }))

    expect(result.success).toBe(true)
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(registrarDia(makeFormData(diaDefaults))).rejects.toThrow("NEXT_REDIRECT")
  })

  it("retorna erro quando trabalhador não é encontrado", async () => {
    state.trabalhadorNotFound = true

    const result = await registrarDia(makeFormData(diaDefaults))
    assertIsError(result)

    expect(result.error).toBe("Trabalhador não encontrado")
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("retorna erro para data vazia", async () => {
    const result = await registrarDia(makeFormData({ ...diaDefaults, data: "" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.data?.[0]).toBe("Selecione a data")
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("retorna erro para tipo inválido", async () => {
    const result = await registrarDia(makeFormData({ ...diaDefaults, tipo: "triplo" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.tipo?.[0]).toBe("Invalid option: expected one of \"inteiro\"|\"meio\"")
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("retorna erro amigável para dia duplicado (código 23505)", async () => {
    state.shouldThrowDuplicate = true

    const result = await registrarDia(makeFormData(diaDefaults))
    assertIsError(result)

    expect(result.error).toContain("já tem registro no dia")
  })

  it("retorna erro genérico quando banco de dados falha", async () => {
    state.dbGenericError = true

    const result = await registrarDia(makeFormData(diaDefaults))
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
  })
})

describe("registrarPagamentoDia", () => {
  const pagamentoDefaults = {
    dia_id: "550e8400-e29b-41d4-a716-446655440000",
    valor_pago: "200",
    data_pagamento: "2024-06-15",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("registra pagamento com dados válidos", async () => {
    mocks.update.mockResolvedValueOnce(undefined)

    const result = await registrarPagamentoDia(makeFormData(pagamentoDefaults))

    expect(result.success).toBe(true)
    expect(mocks.update).toHaveBeenCalledOnce()
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(registrarPagamentoDia(makeFormData(pagamentoDefaults))).rejects.toThrow("NEXT_REDIRECT")
  })

  it("retorna erro quando registro não é encontrado", async () => {
    state.selectNotFound = true

    const result = await registrarPagamentoDia(makeFormData(pagamentoDefaults))
    assertIsError(result)

    expect(result.error).toBe("Registro não encontrado")
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("retorna erro para valor de pagamento zero", async () => {
    const result = await registrarPagamentoDia(makeFormData({ ...pagamentoDefaults, valor_pago: "0" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.valor_pago?.[0]).toBe("Valor pago deve ser positivo")
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("retorna erro para data de pagamento vazia", async () => {
    const result = await registrarPagamentoDia(makeFormData({ ...pagamentoDefaults, data_pagamento: "" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.data_pagamento?.[0]).toBe("Selecione a data do pagamento")
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("retorna erro para dia_id inválido", async () => {
    const result = await registrarPagamentoDia(makeFormData({ ...pagamentoDefaults, dia_id: "invalido" }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.dia_id?.[0]).toBe("Invalid UUID")
    expect(mocks.update).not.toHaveBeenCalled()
  })
})

describe("pagarSemana", () => {
  const trabalhadorId = "550e8400-e29b-41d4-a716-446655440000"

  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("paga semana com sucesso", async () => {
    mocks.update.mockResolvedValueOnce(undefined)

    const result = await pagarSemana(trabalhadorId, ["550e8400-e29b-41d4-a716-446655440000"])

    expect(result.success).toBe(true)
    expect(mocks.update).toHaveBeenCalledOnce()
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(pagarSemana(trabalhadorId, ["550e8400-e29b-41d4-a716-446655440000"])).rejects.toThrow("NEXT_REDIRECT")
  })

  it("retorna erro para ID do trabalhador inválido", async () => {
    const result = await pagarSemana("invalido", ["550e8400-e29b-41d4-a716-446655440000"])
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("aceita array de IDs vazio (nenhuma linha afetada)", async () => {
    mocks.update.mockResolvedValueOnce(undefined)

    const result = await pagarSemana(trabalhadorId, [])

    expect(result.success).toBe(true)
    expect(mocks.update).toHaveBeenCalledOnce()
  })
})

describe("deletarDia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("deleta dia com sucesso", async () => {
    mocks.deleteOne.mockResolvedValueOnce(undefined)

    const result = await deletarDia("550e8400-e29b-41d4-a716-446655440000")

    expect(result.success).toBe(true)
    expect(mocks.deleteOne).toHaveBeenCalledOnce()
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(deletarDia("550e8400-e29b-41d4-a716-446655440000")).rejects.toThrow("NEXT_REDIRECT")
  })

  it("retorna erro quando registro não é encontrado", async () => {
    state.selectNotFound = true

    const result = await deletarDia("550e8400-e29b-41d4-a716-446655440000")
    assertIsError(result)

    expect(result.error).toBe("Registro não encontrado")
    expect(mocks.deleteOne).not.toHaveBeenCalled()
  })

  it("retorna erro para ID inválido", async () => {
    const result = await deletarDia("invalido")
    assertIsError(result)

    expect(result.error).toBe("ID inválido")
    expect(mocks.deleteOne).not.toHaveBeenCalled()
  })
})

describe("atualizarDia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  it("atualiza dia com dados válidos", async () => {
    mocks.update.mockResolvedValueOnce(undefined)

    const result = await atualizarDia(makeFormData({
      id: "550e8400-e29b-41d4-a716-446655440000",
      data: "2024-06-15",
      tipo: "inteiro",
    }))

    expect(result.success).toBe(true)
    expect(mocks.update).toHaveBeenCalledOnce()
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(atualizarDia(makeFormData({
      id: "550e8400-e29b-41d4-a716-446655440000",
      data: "2024-06-15",
      tipo: "inteiro",
    }))).rejects.toThrow("NEXT_REDIRECT")
  })

  it("retorna erro quando registro não é encontrado", async () => {
    state.joinNotFound = true

    const result = await atualizarDia(makeFormData({
      id: "550e8400-e29b-41d4-a716-446655440000",
      data: "2024-06-15",
      tipo: "inteiro",
    }))
    assertIsError(result)

    expect(result.error).toBe("Registro não encontrado")
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("retorna erro genérico quando banco de dados falha na atualização", async () => {
    state.dbGenericError = true

    const result = await atualizarDia(makeFormData({
      id: "550e8400-e29b-41d4-a716-446655440000",
      data: "2024-06-15",
      tipo: "inteiro",
    }))
    assertIsError(result)

    expect(result.error).toBe("Erro ao salvar no banco de dados")
  })

  it("retorna erro para tipo inválido", async () => {
    const result = await atualizarDia(makeFormData({
      id: "550e8400-e29b-41d4-a716-446655440000",
      data: "2024-06-15",
      tipo: "triplo",
    }))
    assertIsError(result)

    expect(result.error).toBe("Verifique os campos")
    expect(result.fieldErrors?.tipo?.[0]).toBe("Invalid option: expected one of \"inteiro\"|\"meio\"")
    expect(mocks.update).not.toHaveBeenCalled()
  })
})

describe("listarDias", () => {
  const trabalhadorId = "550e8400-e29b-41d4-a716-446655440000"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna lista de dias de um trabalhador", async () => {
    const diasMock = [{ id: "1", data: "2024-06-15", tipo: "inteiro", pago: false }]
    mocks.selectAll.mockResolvedValueOnce(diasMock)

    const result = await listarDias(trabalhadorId)

    expect(result).toEqual(diasMock)
    expect(mocks.selectAll).toHaveBeenCalledOnce()
  })

  it("retorna erro quando usuário não está autenticado", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("NEXT_REDIRECT"))

    await expect(listarDias(trabalhadorId)).rejects.toThrow("NEXT_REDIRECT")
  })
})
