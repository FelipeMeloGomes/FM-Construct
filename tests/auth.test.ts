import { describe, it, expect, beforeAll } from "vitest"
import { createToken, verifyToken } from "@/lib/auth"

describe("createToken e verifyToken", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "test-secret-32-chars-minimum!!"
  })

  it("cria token válido que verifica com sucesso", async () => {
    const { token, sub } = await createToken()

    const result = await verifyToken(token)
    expect(result.valid).toBe(true)
    expect(result.sub).toBe(sub)
  })

  it("rejeita token com assinatura inválida", async () => {
    const { token } = await createToken()
    const tampered = token.split(".")[0] + ".assinatura-invalida"

    const result = await verifyToken(tampered)
    expect(result.valid).toBe(false)
  })

  it("rejeita token com payload corrompido", async () => {
    const result = await verifyToken("payload-invalido.assinatura")
    expect(result.valid).toBe(false)
  })

  it("rejeita token com menos de 2 partes", async () => {
    const result = await verifyToken("parte-unica")
    expect(result.valid).toBe(false)
  })
})
