"use client"

import { startTransition, addTransitionType } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode, MouseEvent } from "react"

interface TransitionLinkProps {
  href: string
  children: ReactNode
  type?: "nav-forward" | "nav-back" | "lateral"
  className?: string
  "aria-label"?: string
}

export function TransitionLink({
  href,
  children,
  type = "nav-forward",
  className,
  ...props
}: TransitionLinkProps) {
  const router = useRouter()

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    startTransition(() => {
      addTransitionType(type)
      router.push(href)
    })
  }

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  )
}
