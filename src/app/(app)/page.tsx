import { Suspense } from "react"
import type { Metadata } from "next"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { DirectionalTransition } from "@/components/layout/directional-transition"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function DashboardPage() {
  return (
    <DirectionalTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumo geral da obra</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
    </DirectionalTransition>
  )
}


