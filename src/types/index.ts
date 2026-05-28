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

export interface DashboardResumo {
  totalGastoTrabalhadores: number
  totalPendente: number
  totalPago: number
  totalDespesas: number
  trabalhadoresAtivos: number
  ultimosPagamentos: (DiaTrabalhado & { trabalhador_nome: string })[]
}
