"use server"

import { cookies, headers } from "next/headers"
import { z } from "zod"
import { createToken } from "@/lib/auth"
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit"
import type { ActionResult } from "@/lib/actions/shared"

const loginSchema = z.object({
  username: z.string().min(1, "Campo obrigatório"),
  password: z.string().min(1, "Campo obrigatório"),
})

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: "Preencha todos os campos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }
  const { username, password } = parsed.data

  const headerStore = await headers()
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown"

  const { allowed, delay } = await checkRateLimit(ip)
  if (!allowed) {
    return { success: false, error: "Muitas tentativas. Tente novamente em 15 minutos." }
  }

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const expectedUser = process.env.AUTH_USER
  const expectedPass = process.env.AUTH_PASS

  if (!expectedUser || !expectedPass) {
    logAudit("login_erro_config")
    return { success: false, error: "Autenticação não configurada no servidor" }
  }

  if (username !== expectedUser || password !== expectedPass) {
    await recordAttempt(ip, false)
    logAudit("login_falhou")
    return { success: false, error: "Credenciais inválidas" }
  }

  await recordAttempt(ip, true)

  const { token, sub } = await createToken()
  const cookieStore = await cookies()

  cookieStore.set("fm_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  })

  cookieStore.set("fm_sub", sub, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  })

  logAudit("login_ok", "Login bem-sucedido")
  return { success: true }
}

export async function logoutAction(): Promise<ActionResult> {
  const cookieStore = await cookies()
  cookieStore.set("fm_auth", "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" })
  cookieStore.set("fm_sub", "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" })
  logAudit("logout")
  return { success: true }
}
