import { Suspense } from "react"
import type { Metadata } from "next"
import { HardHat } from "lucide-react"

export const metadata: Metadata = {
  title: "Login",
}
import { LoginForm } from "./login-form"
import { AnimatedBgWrapper } from "./animated-bg-wrapper"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-4">
      <AnimatedBgWrapper />

      {/* Background gradient — light */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent dark:hidden"
        aria-hidden
      />

      {/* Background gradient — dark */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.05] to-transparent hidden dark:block"
        aria-hidden
      />

      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border bg-card/80 p-8 backdrop-blur-xl shadow-xl dark:shadow-amber-500/5 dark:border-amber-500/10">
          {/* Top accent line */}
          <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-lg shadow-primary/25 dark:shadow-amber-500/20">
              <HardHat className="size-7" />
            </span>
            <div className="text-center">
              <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold tracking-tight text-foreground">
                FM-<span className="text-primary">Construct</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesso restrito
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-6 border-t border-border" />

          {/* Form */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
