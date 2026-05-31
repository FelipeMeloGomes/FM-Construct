"use client"

import { useState, useMemo, useCallback } from "react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Plus, Edit, Trash2, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react"
import { TransitionLink } from "@/components/layout/transition-link"
import { deletarTrabalhador, deletarTrabalhadores } from "@/lib/actions/trabalhadores"
import { RegistrarDiaDialog } from "@/components/trabalhadores/registrar-dia-dialog"
import type { Trabalhador } from "@/types"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { BulkDeleteBar } from "@/components/ui/bulk-delete-bar"

type SortKey = "nome" | "funcao" | "diaria" | "status" | "pendente"

interface SortConfig {
  key: SortKey
  dir: "asc" | "desc"
}

interface Props {
  trabalhadores: (Trabalhador & { total_pendente: number })[]
}

const COLUMNS: { key: SortKey; label: string; hide: string }[] = [
  { key: "nome", label: "Nome", hide: "" },
  { key: "funcao", label: "Função", hide: "md:table-cell" },
  { key: "diaria", label: "Diária", hide: "md:table-cell" },
  { key: "status", label: "Status", hide: "sm:table-cell" },
  { key: "pendente", label: "Pendente", hide: "" },
]

function SortIcon({ column, config }: { column: SortKey; config: SortConfig | null }) {
  if (config?.key !== column) {
    return <ArrowUpDown className="ml-1 size-3 text-muted-foreground/40" />
  }
  return config.dir === "asc"
    ? <ArrowUp className="ml-1 size-3" />
    : <ArrowDown className="ml-1 size-3" />
}

const PAGE_SIZE = 20

export function TrabalhadoresTable({ trabalhadores }: Props) {
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return trabalhadores
    const q = search.trim().toLowerCase()
    return trabalhadores.filter(
      (t) => t.nome.toLowerCase().includes(q) || t.funcao.toLowerCase().includes(q)
    )
  }, [trabalhadores, search])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sort.key) {
        case "nome":
          cmp = a.nome.localeCompare(b.nome)
          break
        case "funcao":
          cmp = a.funcao.localeCompare(b.funcao)
          break
        case "diaria":
          cmp = Number(a.valor_diaria) - Number(b.valor_diaria)
          break
        case "status":
          cmp = Number(b.ativo) - Number(a.ativo)
          break
        case "pendente":
          cmp = Number(a.total_pendente) - Number(b.total_pendente)
          break
      }
      return sort.dir === "asc" ? cmp : -cmp
    })
  }, [filtered, sort])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(totalPages, 1))

  const paginated = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage]
  )

  const allIds = useMemo(() => sorted.map((t) => t.id), [sorted])
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someSelected = allIds.some((id) => selected.has(id))

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev?.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" }
      }
      return { key, dir: key === "nome" || key === "funcao" ? "asc" : "desc" }
    })
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
    setSelected(new Set())
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome ou função..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-1 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground cursor-pointer"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {sorted.length > 0 && (
          <span className="hidden sm:block text-xs text-muted-foreground/60 shrink-0">
            {sorted.length} registro{sorted.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {selected.size > 0 && (
        <BulkDeleteBar
          selectedCount={selected.size}
          onDelete={() => deletarTrabalhadores(Array.from(selected))}
          onClear={() => setSelected(new Set())}
          entityLabel="trabalhador"
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                onChange={toggleSelectAll}
                className="size-4 rounded border-border bg-background text-primary focus:ring-ring cursor-pointer"
                aria-label="Selecionar todos"
              />
            </TableHead>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={`${col.hide ? `hidden ${col.hide}` : ""} cursor-pointer select-none ${sort?.key === col.key ? "text-foreground" : ""} ${col.key === "pendente" ? "text-right" : ""}`}
                onClick={() => toggleSort(col.key)}
              >
                <div className="inline-flex items-center">
                  {col.label}
                  <SortIcon column={col.key} config={sort} />
                </div>
              </TableHead>
            ))}
            <TableHead className="w-20 md:w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                {search ? "Nenhum trabalhador encontrado" : "Nenhum trabalhador cadastrado"}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleSelect(t.id)}
                    className="size-4 rounded border-border bg-background text-primary focus:ring-ring cursor-pointer"
                    aria-label={`Selecionar ${t.nome}`}
                  />
                </TableCell>
                <TableCell>
                  <TransitionLink href={`/trabalhadores/${t.id}`} type="nav-forward" className="group inline-flex items-center gap-1 font-medium hover:text-amber-400 transition-colors">
                    {t.nome}
                    <ChevronRight className="size-3.5 text-slate-500 sm:opacity-0 sm:-ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </TransitionLink>
                </TableCell>
                <TableCell className="hidden md:table-cell capitalize">{t.funcao}</TableCell>
                <TableCell className="hidden md:table-cell">{formatCurrency(Number(t.valor_diaria))}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={t.ativo ? "default" : "secondary"}>
                    {t.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-red-400">
                  {formatCurrency(Number(t.total_pendente))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <RegistrarDiaDialog
                      trabalhadorId={t.id}
                      valorDiaria={Number(t.valor_diaria)}
                      trigger={<Button variant="ghost" size="icon" className="size-9 md:size-8 text-emerald-400 hover:text-emerald-300 cursor-pointer" aria-label="Registrar dia">
                        <Plus className="size-4" />
                      </Button>}
                    />
                    <TransitionLink href={`/trabalhadores/${t.id}/editar`} type="nav-forward">
                      <Button variant="ghost" size="icon" className="size-9 md:size-8 cursor-pointer" aria-label="Editar trabalhador">
                        <Edit className="size-4 md:size-3.5" />
                      </Button>
                    </TransitionLink>
                    <ConfirmDialog
                      action={deletarTrabalhador.bind(null, t.id)}
                      title={`Excluir ${t.nome}?`}
                      description="Todos os dias registrados e pagamentos serão removidos. Esta ação não pode ser desfeita."
                      successMessage="Trabalhador excluído"
                    >
                      <Button variant="ghost" size="icon" className="size-9 md:size-8 text-slate-500 hover:text-red-400 cursor-pointer" aria-label="Excluir trabalhador">
                        <Trash2 className="size-4 md:size-3.5" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
