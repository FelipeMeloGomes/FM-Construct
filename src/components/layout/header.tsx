"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HardHat } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-center md:justify-between px-4 md:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
            <HardHat className="size-5" />
          </span>
          <span className="font-[family-name:var(--font-sora)] text-lg font-bold tracking-tight text-foreground">
            FM-<span className="text-primary">Construct</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { href: "/", label: "Dashboard" },
              { href: "/trabalhadores", label: "Trabalhadores" },
              { href: "/despesas", label: "Despesas" },
              { href: "/relatorios", label: "Relatórios" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {pathname === link.href && (
                  <span className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/20" />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
