"use server"

import { cookies, headers } from "next/headers"
import { createToken } from "@/lib/auth"
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit"
import type { ActionResult } from "@/lib/actions/shared"

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const redirectTo = (formData.get("redirect") as string) || "/"

  if (!username || !password) {
    return { success: false, error: "Preencha todos os campos", fieldErrors: { username: !username ? ["Campo obrigatório"] : [], password: !password ? ["Campo obrigatório"] : [] } }
  }

  const headerStore = await headers()
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown"

  const { allowed, delay } = checkRateLimit(ip)
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
    recordAttempt(ip, false)
    logAudit("login_falhou", `Usuário: ${username}`)
    return { success: false, error: "Credenciais inválidas" }
  }

  recordAttempt(ip, true)

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

  logAudit("login_ok")
  return { success: true }
}
