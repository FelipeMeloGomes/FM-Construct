"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { loginAction } from "@/actions/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldErrors, getFieldErrors } from "@/components/ui/field-error"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get("redirect")
  const redirectTo = rawRedirect && /^\/(?!\/)/.test(rawRedirect) ? rawRedirect : "/"
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>()
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setServerError("")
    setFieldErrors(undefined)

    const formData = new FormData(e.currentTarget)
    formData.set("redirect", redirectTo)

    const result = await loginAction(formData)

    if (!result.success) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      setServerError(result.error || "Erro ao fazer login")
      setPending(false)
      return
    }

    router.push(redirectTo)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-medium text-foreground">
          Usuário
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Seu usuário"
          required
          disabled={pending}
          className="h-10 md:h-9"
          aria-invalid={!!getFieldErrors("username", fieldErrors)}
          aria-describedby="username-error"
        />
        <FieldErrors errors={getFieldErrors("username", fieldErrors)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Sua senha"
            required
            disabled={pending}
            className="h-10 md:h-9 pr-10"
            aria-invalid={!!getFieldErrors("password", fieldErrors)}
            aria-describedby="password-error"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={pending}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60 cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <FieldErrors errors={getFieldErrors("password", fieldErrors)} />
      </div>

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-glow relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer md:py-2.5"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
