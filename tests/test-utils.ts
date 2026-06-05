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
