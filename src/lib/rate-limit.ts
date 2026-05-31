const attempts = new Map<string, { count: number; blockedUntil: number }>()

const MAX_ATTEMPTS = 10
const BLOCK_DURATION = 15 * 60 * 1000
const RESET_AFTER = 30 * 60 * 1000

export function checkRateLimit(ip: string): { allowed: boolean; delay: number } {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (entry) {
    if (entry.blockedUntil > now) {
      return { allowed: false, delay: 0 }
    }
    if (now - entry.blockedUntil > RESET_AFTER && entry.blockedUntil > 0) {
      attempts.delete(ip)
      return { allowed: true, delay: 0 }
    }
  }

  const count = entry ? entry.count : 0
  const delay = Math.min(1000 * Math.pow(2, count - 1), 30000)

  if (count >= MAX_ATTEMPTS) {
    attempts.set(ip, { count, blockedUntil: now + BLOCK_DURATION })
    return { allowed: false, delay: 0 }
  }

  return { allowed: true, delay }
}

export function recordAttempt(ip: string, success: boolean) {
  const entry = attempts.get(ip)

  if (success) {
    attempts.delete(ip)
    return
  }

  const count = entry ? entry.count + 1 : 1
  attempts.set(ip, { count, blockedUntil: 0 })
}
