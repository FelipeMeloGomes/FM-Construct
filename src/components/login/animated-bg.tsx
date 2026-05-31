"use client"

import { useState } from "react"
import { HardHat, Wrench, Hammer, Ruler, TriangleAlert, Building, PencilRuler, Pickaxe } from "lucide-react"

interface FloatIcon {
  id: number
  Icon: React.ComponentType<{ className?: string }>
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

const ICONS = [HardHat, Wrench, Hammer, Ruler, TriangleAlert, Building, PencilRuler]

export default function AnimatedBg() {
  const [icons] = useState<FloatIcon[]>(() =>
    ICONS.map((Icon, i) => ({
      id: i,
      Icon,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 85,
      size: 20 + Math.random() * 16,
      duration: 18 + Math.random() * 20,
      delay: -(Math.random() * 20),
    }))
  )

  const [pickaxes] = useState<FloatIcon[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i + 100,
      Icon: Pickaxe,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 28 + Math.random() * 24,
      duration: 14 + Math.random() * 12,
      delay: -(Math.random() * 15),
    }))
  )

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* Blueprint grid */}
      <svg className="absolute inset-0 h-full w-full text-foreground opacity-[0.04] dark:opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="blueprint-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <pattern id="blueprint-dot" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        <rect width="100%" height="100%" fill="url(#blueprint-dot)" />
      </svg>

      {/* Light mode accent glow */}
      <div className="absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-amber-500/3 blur-[120px] dark:hidden" />

      {/* Dark mode accent glow */}
      <div className="absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-amber-500/8 blur-[120px] hidden dark:block" />

      {/* Pickaxes (ambient floating) */}
      {pickaxes.map((icon) => (
        <div
          key={icon.id}
          className="absolute text-amber-600/20 dark:text-amber-400/15"
          style={{
            left: icon.x + "%",
            top: icon.y + "%",
            animation: `login-float-pickaxe ${icon.duration}s ease-in-out ${icon.delay}s infinite alternate`,
          }}
        >
          <icon.Icon className="size-8 md:size-10" />
        </div>
      ))}

      {/* Floating construction icons */}
      {icons.map((icon) => (
        <div
          key={icon.id}
          className="absolute text-amber-600/25 dark:text-amber-400/20"
          style={{
            left: icon.x + "%",
            top: icon.y + "%",
            animation: `login-float-icon ${icon.duration}s ease-in-out ${icon.delay}s infinite alternate`,
          }}
        >
          <icon.Icon className="size-8 md:size-10" />
        </div>
      ))}
    </div>
  )
}
