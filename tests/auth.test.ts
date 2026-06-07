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

  it("rejeita token expirado", async () => {
    const exp = Math.floor(Date.now() / 1000) - 1
    const sub = crypto.randomUUID()
    const payload = JSON.stringify({ sub, exp })
    const data = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(process.env.AUTH_SECRET) as BufferSource,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const sigBytes = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data) as BufferSource)
    const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    const expiredToken = `${data}.${sig}`

    const result = await verifyToken(expiredToken)
    expect(result.valid).toBe(false)
  })

  it("rejeita token criado com outro segredo", async () => {
    const origSecret = process.env.AUTH_SECRET
    process.env.AUTH_SECRET = "other-secret-32-chars-minimum!!!"
    const { token } = await createToken()
    process.env.AUTH_SECRET = origSecret

    const result = await verifyToken(token)
    expect(result.valid).toBe(false)
  })
})
