"use client"

import { ViewTransition } from "react"
import type { ReactNode } from "react"

export function DirectionalTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        lateral: "lateral",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        lateral: "lateral",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
