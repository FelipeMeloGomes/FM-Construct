"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, X } from "lucide-react"
import type { ActionResult } from "@/lib/actions/shared"

interface BulkDeleteBarProps {
  selectedCount: number
  onDelete: () => Promise<ActionResult>
  onClear: () => void
  entityLabel: string
}

export function BulkDeleteBar({ selectedCount, onDelete, onClear, entityLabel }: BulkDeleteBarProps) {
  const [pending, setPending] = useState(false)
  const router = useRouter()

  if (selectedCount === 0) return null

  async function handleDelete() {
    setPending(true)
    const result = await onDelete()
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(`${selectedCount} ${entityLabel}${selectedCount !== 1 ? "s" : ""} excluído${selectedCount !== 1 ? "s" : ""}`)
    onClear()
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5">
      <span className="text-sm text-foreground">
        <strong>{selectedCount}</strong> {entityLabel}{selectedCount !== 1 ? "s" : ""} selecionado{selectedCount !== 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={pending}
          className="cursor-pointer h-8 px-2 text-xs"
        >
          <X className="size-3.5 mr-1" />
          Limpar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={pending}
          className="cursor-pointer h-8 px-3 text-xs"
        >
          <Trash2 className="size-3.5 mr-1" />
          {pending ? "Excluindo..." : `Excluir ${selectedCount > 1 ? "selecionados" : "selecionado"}`}
        </Button>
      </div>
    </div>
  )
}
