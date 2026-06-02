import { headers } from "next/headers"
import { getDb } from "@/lib/db"

function sanitizeLog(value: string): string {
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
}

export async function logAudit(acao: string, detalhes?: string) {
  try {
    const db = await getDb()
    const h = await headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
    await db`INSERT INTO audit_log (acao, detalhes, ip) VALUES (${acao}, ${detalhes ? sanitizeLog(detalhes) : null}, ${ip})`
  } catch {
    // Audit logging never breaks the main flow
  }
}
