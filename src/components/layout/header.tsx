"use client"

import { usePathname } from "next/navigation"
import { HardHat } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { navLinks } from "@/lib/navigation"
import { TransitionLink } from "./transition-link"

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

export function Header() {
  const pathname = usePathname()

  if (pathname.startsWith("/login")) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60" style={{ viewTransitionName: "site-header" }}>
      <div className="flex h-16 items-center justify-center md:justify-between px-4 md:px-6">
        <TransitionLink href="/" className="group flex items-center gap-2.5" type="nav-back" aria-label="Página inicial">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-amber-600 text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
            <HardHat className="size-5" />
          </span>
          <span className="font-[family-name:var(--font-sora)] text-lg font-bold tracking-tight text-foreground">
            FM-<span className="text-primary">Construct</span>
          </span>
        </TransitionLink>

        <div className="flex items-center gap-1">
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                type="lateral"
                className={cn(
                  "relative px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href, pathname)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                aria-label={link.label}
              >
                {isActive(link.href, pathname) && (
                  <span className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/20" />
                )}
                <span className="relative">{link.label}</span>
              </TransitionLink>
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
