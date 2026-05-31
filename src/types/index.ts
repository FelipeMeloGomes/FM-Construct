export interface Trabalhador {
  id: string
  nome: string
  funcao: "pedreiro" | "servente"
  valor_diaria: number
  ativo: boolean
  created_at: string
}

export interface DiaTrabalhado {
  id: string
  trabalhador_id: string
  data: string
  tipo: "inteiro" | "meio"
  valor_dia: number
  pago: boolean
  valor_pago: number | null
  data_pagamento: string | null
  observacao: string | null
  created_at: string
}

export interface Despesa {
  id: string
  descricao: string
  categoria: "material" | "alimentacao" | "transporte" | "ferramentas" | "outros"
  valor: number
  data: string
  pago_para: string | null
  observacao: string | null
  created_at: string
}

export type CategoriaDespesa = Despesa["categoria"]

export const CATEGORIAS_DESPESA: { value: CategoriaDespesa; label: string }[] = [
  { value: "material", label: "Material" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "transporte", label: "Transporte" },
  { value: "ferramentas", label: "Ferramentas" },
  { value: "outros", label: "Outros" },
]

export const CATEGORY_BADGE_COLORS: Record<CategoriaDespesa, string> = {
  material: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  alimentacao: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  transporte: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ferramentas: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  outros: "bg-slate-500/20 text-slate-400 border-slate-500/30",
}

export interface DashboardResumo {
  totalGastoTrabalhadores: number
  totalPendente: number
  totalPago: number
  totalDespesas: number
  trabalhadoresAtivos: number
  ultimosPagamentos: (DiaTrabalhado & { trabalhador_nome: string })[]
}
