import { LayoutDashboard, Users, Receipt, FileText, type LucideIcon } from "lucide-react"

export interface NavLink {
  href: string
  label: string
  shortLabel?: string
  icon: LucideIcon
}

export const navLinks: NavLink[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trabalhadores", label: "Trabalhadores", shortLabel: "Trab.", icon: Users },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
]
