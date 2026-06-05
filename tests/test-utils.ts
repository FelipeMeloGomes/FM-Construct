import type { ActionResult } from "@/lib/actions/shared"

export function assertIsError(r: ActionResult): asserts r is {
  success: false
  error: string
  fieldErrors?: Record<string, string[]>
} {
  if (r.success) throw new Error("Expected failure, got success")
}

export function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value)
  }
  return fd
}

export class DbError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

export function sqlTagMock(handlers: Record<string, () => unknown>) {
  return async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.reduce(
      (acc, s, i) => acc + s + (values[i] !== undefined ? `$${i + 1}` : ""),
      ""
    )
    for (const [pattern, handler] of Object.entries(handlers)) {
      if (sql.includes(pattern)) return handler()
    }
    return []
  }
}
