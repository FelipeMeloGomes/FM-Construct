import "server-only"

// NOTA: O IP é obtido via x-forwarded-for. Em self-host, um proxy reverso
// (nginx, Cloudflare, etc.) DEVE sobrescrever esse header para evitar spoofing.
// Na Vercel, isso é gerenciado automaticamente pela plataforma.
import { getDb } from "@/lib/db"

const MAX_ATTEMPTS = 10
const BLOCK_DURATION_MS = 15 * 60 * 1000
const RESET_AFTER_MS = 30 * 60 * 1000

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; delay: number }> {
  const db = await getDb()
  const rows = await db`SELECT attempt_count, blocked_until FROM rate_limits WHERE ip = ${ip}`
  const row = rows[0] as { attempt_count: number; blocked_until: Date | null } | undefined

  if (row?.blocked_until) {
    const blockedUntil = new Date(row.blocked_until).getTime()
    if (blockedUntil > Date.now()) {
      return { allowed: false, delay: 0 }
    }
    if (Date.now() - blockedUntil > RESET_AFTER_MS) {
      await db`DELETE FROM rate_limits WHERE ip = ${ip}`
      return { allowed: true, delay: 0 }
    }
  }

  const count = row?.attempt_count ?? 0
  const delay = Math.min(1000 * Math.pow(2, count - 1), 30000)

  if (count >= MAX_ATTEMPTS) {
    const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS).toISOString()
    await db`UPDATE rate_limits SET blocked_until = ${blockedUntil}::timestamptz, updated_at = NOW() WHERE ip = ${ip}`
    return { allowed: false, delay: 0 }
  }

  return { allowed: true, delay }
}

export async function recordAttempt(ip: string, success: boolean) {
  const db = await getDb()

  if (success) {
    await db`DELETE FROM rate_limits WHERE ip = ${ip}`
    return
  }

  await db`
    INSERT INTO rate_limits (ip, attempt_count, updated_at)
    VALUES (${ip}, 1, NOW())
    ON CONFLICT (ip) DO UPDATE SET
      attempt_count = rate_limits.attempt_count + 1,
      updated_at = NOW()
  `
}
