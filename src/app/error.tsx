"use client"

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-bold text-destructive">Algo deu errado</h1>
      <button onClick={reset} className="btn-glow mt-6 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 cursor-pointer">
        Tentar novamente
      </button>
    </div>
  )
}
