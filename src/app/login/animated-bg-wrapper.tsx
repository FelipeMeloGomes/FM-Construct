"use client"

import dynamic from "next/dynamic"

const AnimatedBg = dynamic(() => import("@/components/login/animated-bg"), { ssr: false })

export function AnimatedBgWrapper() {
  return <AnimatedBg />
}
