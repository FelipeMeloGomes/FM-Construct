import { z } from "zod"

export type ActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export function parseError(e: unknown): ActionResult {
  if (e instanceof z.ZodError) {
    const flattened = e.flatten()
    const messages = Object.values(flattened.fieldErrors).flat() as string[]
    return {
      success: false,
      error: messages.length > 0 ? messages[0] : "Dados inválidos",
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    }
  }
  if (e instanceof Error) return { success: false, error: e.message }
  return { success: false, error: "Erro desconhecido" }
}
