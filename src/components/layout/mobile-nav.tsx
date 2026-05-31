"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navLinks } from "@/lib/navigation"
import { TransitionLink } from "./transition-link"

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

export function MobileNav() {
  const pathname = usePathname()

  if (pathname.startsWith("/login")) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-xl md:hidden" style={{ viewTransitionName: "site-nav" }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navLinks.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href, pathname)
          return (
            <TransitionLink
              key={link.href}
              href={link.href}
              type="lateral"
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
          active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={link.label}
            >
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
              )}
              <Icon className={cn("size-5", active && "drop-shadow-[0_0_6px_var(--primary)]")} />
              {link.shortLabel || link.label}
            </TransitionLink>
          )
        })}
      </div>
    </nav>
  )
}
