"use client"

import { useEffect, useState } from "react"
import AnimatedBg from "@/components/login/animated-bg"

export function AnimatedBgWrapper() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return <AnimatedBg />
}
