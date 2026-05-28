"use client"

import { useEffect, useRef, type ReactNode } from "react"

export function PageAnimation({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const children = el.querySelectorAll<HTMLElement>(".stagger")
    children.forEach((child, i) => {
      child.style.setProperty("--index", String(i))
    })
  }, [])

  return <div ref={ref}>{children}</div>
}
