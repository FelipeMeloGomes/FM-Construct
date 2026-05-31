"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

interface PaginationBarProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  baseHref?: string
}

function buildPages(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis")
    }
  }
  return pages
}

export function PaginationBar({ currentPage, totalPages, onPageChange, baseHref }: PaginationBarProps) {
  if (totalPages <= 1) return null

  const pages = buildPages(currentPage, totalPages)
  const isLink = !!baseHref

  function renderPageBtn(p: number) {
    const active = p === currentPage
    const variant = active ? "outline" : "ghost"
    const cls = `cursor-pointer h-8 w-8 p-0 text-xs ${active ? "" : "text-muted-foreground"}`
    if (isLink) {
      return (
        <Button key={p} variant={variant} size="sm" className={cls} render={<a href={`${baseHref}?page=${p}`}>{p}</a>} />
      )
    }
    return (
      <Button key={p} variant={variant} size="sm" className={cls} onClick={() => onPageChange?.(p)}>{p}</Button>
    )
  }

  function renderNav(direction: "prev" | "next") {
    const isPrev = direction === "prev"
    const disabled = isPrev ? currentPage <= 1 : currentPage >= totalPages
    const label = isPrev ? "Anterior" : "Próxima"
    const icon = isPrev
      ? <ChevronLeftIcon className="size-3.5 mr-1" />
      : <ChevronRightIcon className="size-3.5 ml-1" />
    const targetPage = isPrev ? currentPage - 1 : currentPage + 1
    const cls = "cursor-pointer h-8 px-2 text-xs"

    if (isLink && !disabled) {
      return (
        <Button variant="ghost" size="sm" className={cls} render={<a href={`${baseHref}?page=${targetPage}`} className="inline-flex items-center">{icon}{label}</a>} />
      )
    }
    return (
      <Button variant="ghost" size="sm" disabled={disabled} className={cls} onClick={() => onPageChange?.(targetPage)}>
        {isPrev && icon}{label}{!isPrev && icon}
      </Button>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      {renderNav("prev")}
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="flex size-8 items-center justify-center text-xs text-muted-foreground/50">
            <MoreHorizontalIcon className="size-3.5" />
          </span>
        ) : (
          renderPageBtn(p)
        )
      )}
      {renderNav("next")}
    </div>
  )
}
