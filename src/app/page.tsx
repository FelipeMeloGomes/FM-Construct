import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-400">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Resumo geral da obra</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  )
}
