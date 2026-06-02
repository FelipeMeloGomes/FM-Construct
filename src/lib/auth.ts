import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "fm_auth"
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60

const encoder = new TextEncoder()

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set")
  return encoder.encode(secret)
}

async function sign(data: string, key: Uint8Array): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data) as BufferSource)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export async function createToken(): Promise<{ token: string; sub: string }> {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE
  const sub = crypto.randomUUID()
  const payload = JSON.stringify({ sub, exp })
  const data = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  const sig = await sign(data, getSecret())
  return { token: `${data}.${sig}`, sub }
}

export async function verifyToken(token: string): Promise<{ valid: boolean; sub?: string }> {
  try {
    const parts = token.split(".")
    if (parts.length !== 2) return { valid: false }
    const [data, sig] = parts

    const expected = await sign(data, getSecret())
    if (sig !== expected) return { valid: false }

    const payload = JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/")))
    if (payload.exp < Math.floor(Date.now() / 1000)) return { valid: false }

    return { valid: true, sub: payload.sub }
  } catch {
    return { valid: false }
  }
}

export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const subCookie = cookieStore.get("fm_sub")?.value

  if (!token) redirect("/login")

  const result = await verifyToken(token)
  if (!result.valid || !result.sub || result.sub !== subCookie) {
    redirect("/login")
  }
}

export async function requireAuthApi(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const subCookie = request.cookies.get("fm_sub")?.value

  if (!token) return false

  const result = await verifyToken(token)
  return !!result.valid && !!result.sub && result.sub === subCookie
}
