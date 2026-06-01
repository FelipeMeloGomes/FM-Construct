import { describe, it, expect } from "vitest"
import { z } from "zod"
import { parseError } from "@/lib/actions/shared"

describe("parseError", () => {
  it("retorna fieldErrors para ZodError", () => {
    const schema = z.object({ nome: z.string().min(3) })
    const result = schema.safeParse({ nome: "ab" })
    if (result.success) throw new Error("Expected parse failure")

    const parsed = parseError(result.error)

    expect(parsed.success).toBe(false)
    expect(parsed.error).toBeTruthy()
    expect(parsed.fieldErrors?.nome).toBeDefined()
  })

  it("usa primeira mensagem de erro quando há múltiplos campos", () => {
    const schema = z.object({
      nome: z.string().min(3),
      email: z.string().email(),
    })
    const result = schema.safeParse({ nome: "ab", email: "invalido" })
    if (result.success) throw new Error("Expected parse failure")

    const parsed = parseError(result.error)
    const fieldErrorCount = Object.keys(parsed.fieldErrors ?? {}).length

    expect(parsed.success).toBe(false)
    expect(parsed.error).toBeTruthy()
    expect(fieldErrorCount).toBe(2)
  })

  it("retorna mensagem para Error comum", () => {
    const parsed = parseError(new Error("Algo deu errado"))

    expect(parsed.success).toBe(false)
    expect(parsed.error).toBe("Algo deu errado")
  })

  it("retorna mensagem genérica para erro desconhecido", () => {
    const parsed = parseError("string qualquer")

    expect(parsed.success).toBe(false)
    expect(parsed.error).toBe("Erro desconhecido")
  })
})
