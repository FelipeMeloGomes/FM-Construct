"use client"

import { useSyncExternalStore } from "react"
import AnimatedBg from "@/components/login/animated-bg"

export function AnimatedBgWrapper() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  if (!mounted) return null
  return <AnimatedBg />
}
