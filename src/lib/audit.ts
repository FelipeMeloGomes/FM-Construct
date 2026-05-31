import { headers } from "next/headers"
import { getDb } from "@/lib/db"

export async function logAudit(acao: string, detalhes?: string) {
  try {
    const db = await getDb()
    const h = await headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
    await db`INSERT INTO audit_log (acao, detalhes, ip) VALUES (${acao}, ${detalhes || null}, ${ip})`
  } catch {
    // Audit logging never breaks the main flow
  }
}
