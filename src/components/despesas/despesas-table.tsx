"use client"

import { useState, useMemo, useCallback } from "react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Search, X, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { TransitionLink } from "@/components/layout/transition-link"
import { deletarDespesa, deletarDespesas } from "@/lib/actions/despesas"
import { CATEGORIAS_DESPESA, CATEGORY_BADGE_COLORS } from "@/types"
import type { Despesa, CategoriaDespesa } from "@/types"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { BulkDeleteBar } from "@/components/ui/bulk-delete-bar"

type SortKey = "data" | "descricao" | "categoria" | "pago_para" | "valor"

interface SortConfig {
  key: SortKey
  dir: "asc" | "desc"
}

interface Props {
  despesas: Despesa[]
}

const COLUMNS: { key: SortKey; label: string; hide: string }[] = [
  { key: "data", label: "Data", hide: "" },
  { key: "descricao", label: "Descrição", hide: "" },
  { key: "categoria", label: "Categoria", hide: "sm:table-cell" },
  { key: "pago_para", label: "Pago para", hide: "sm:table-cell" },
  { key: "valor", label: "Valor", hide: "" },
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

export function DespesasTable({ despesas }: Props) {
  const [sort, setSort] = useState<SortConfig | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return despesas
    const q = search.trim().toLowerCase()
    return despesas.filter((d) => {
      const cat = CATEGORIAS_DESPESA.find((c) => c.value === d.categoria)
      return (
        d.descricao.toLowerCase().includes(q) ||
        (d.pago_para && d.pago_para.toLowerCase().includes(q)) ||
        (cat?.label.toLowerCase().includes(q))
      )
    })
  }, [despesas, search])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sort.key) {
        case "data":
          cmp = new Date(a.data).getTime() - new Date(b.data).getTime()
          break
        case "descricao":
          cmp = a.descricao.localeCompare(b.descricao)
          break
        case "categoria":
          cmp = a.categoria.localeCompare(b.categoria)
          break
        case "pago_para":
          cmp = (a.pago_para || "").localeCompare(b.pago_para || "")
          break
        case "valor":
          cmp = Number(a.valor) - Number(b.valor)
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

  const allIds = useMemo(() => sorted.map((d) => d.id), [sorted])
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
      return { key, dir: key === "valor" ? "desc" : "asc" }
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
            placeholder="Buscar por descrição ou favorecido..."
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
          onDelete={() => deletarDespesas(Array.from(selected))}
          onClear={() => setSelected(new Set())}
          entityLabel="despesa"
          entityLabelPlural="despesas"
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
                aria-label="Selecionar todas"
              />
            </TableHead>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={`${col.hide ? `hidden ${col.hide}` : ""} cursor-pointer select-none ${sort?.key === col.key ? "text-foreground" : ""} ${col.key === "valor" ? "text-right" : ""}`}
                onClick={() => toggleSort(col.key)}
              >
                <div className="inline-flex items-center">
                  {col.label}
                  <SortIcon column={col.key} config={sort} />
                </div>
              </TableHead>
            ))}
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                {search ? "Nenhuma despesa encontrada" : "Nenhuma despesa registrada"}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(d.id)}
                    onChange={() => toggleSelect(d.id)}
                    className="size-4 rounded border-border bg-background text-primary focus:ring-ring cursor-pointer"
                    aria-label={`Selecionar ${d.descricao}`}
                  />
                </TableCell>
                <TableCell>{formatDate(d.data)}</TableCell>
                <TableCell className="font-medium">{d.descricao}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className={CATEGORY_BADGE_COLORS[d.categoria as CategoriaDespesa] || CATEGORY_BADGE_COLORS.outros}>
                    {CATEGORIAS_DESPESA.find((c) => c.value === d.categoria)?.label || d.categoria}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{d.pago_para || <span className="text-muted-foreground/60 text-xs">Sem pgto</span>}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(Number(d.valor))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TransitionLink href={`/despesas/${d.id}/editar`} type="nav-forward">
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary cursor-pointer" aria-label="Editar despesa">
                        <Edit className="size-3.5" />
                      </Button>
                    </TransitionLink>
                    <ConfirmDialog
                      action={deletarDespesa.bind(null, d.id)}
                      title="Excluir despesa?"
                      description={`Remover "${d.descricao}" no valor de ${formatCurrency(Number(d.valor))}?`}
                      successMessage="Despesa excluída"
                    >
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive cursor-pointer" aria-label="Excluir despesa">
                        <Trash2 className="size-3.5" />
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
