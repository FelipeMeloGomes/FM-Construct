"use client"

import { useRouter } from "next/navigation"

function getMeses(): { value: string; label: string }[] {
  const meses: { value: string; label: string }[] = []
  const hoje = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    meses.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return meses
}

export function FiltroMes({ mesAtual }: { mesAtual: string }) {
  const router = useRouter()
  const meses = getMeses()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="mes" className="text-sm text-slate-400">Mês:</label>
      <select
        id="mes"
        value={mesAtual}
        onChange={(e) => {
          const val = e.target.value
          router.push(val ? `/relatorios?mes=${val}` : "/relatorios")
        }}
        className="flex h-9 w-48 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-200 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
      >
        <option value="">Todos os meses</option>
        {meses.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  )
}
