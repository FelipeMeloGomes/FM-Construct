import { describe, it, expect } from "vitest"
import { z } from "zod"
import { parseError, type ActionResult } from "@/lib/actions/shared"

function assertIsError(r: ActionResult): asserts r is {
  success: false
  error: string
  fieldErrors?: Record<string, string[]>
} {
  if (r.success) throw new Error("Expected failure, got success")
}

describe("parseError", () => {
  it("retorna fieldErrors para ZodError", () => {
    const schema = z.object({ nome: z.string().min(3) })
    const result = schema.safeParse({ nome: "ab" })
    if (result.success) throw new Error("Expected parse failure")

    const parsed = parseError(result.error)
    assertIsError(parsed)

    expect(parsed.error).toContain("expected string to have >=3 characters")
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
    assertIsError(parsed)

    expect(parsed.error).toContain("expected string to have >=3 characters")
    expect(parsed.fieldErrors?.nome).toBeDefined()
    expect(parsed.fieldErrors?.email).toBeDefined()
  })

  it("retorna mensagem para Error comum", () => {
    const parsed = parseError(new Error("Algo deu errado"))
    assertIsError(parsed)

    expect(parsed.error).toBe("Algo deu errado")
  })

  it("retorna mensagem genérica para erro desconhecido", () => {
    const parsed = parseError("string qualquer")
    assertIsError(parsed)

    expect(parsed.error).toBe("Erro desconhecido")
  })
})
