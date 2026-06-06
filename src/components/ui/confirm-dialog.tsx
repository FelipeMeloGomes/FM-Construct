"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { ActionResult } from "@/lib/actions/shared"
import type { ReactElement } from "react"

interface ConfirmDialogProps {
  action: () => Promise<ActionResult | undefined | void>
  title: string
  description: string
  confirmText?: string
  successMessage?: string
  variant?: "destructive" | "default"
  children: ReactElement
}

export function ConfirmDialog({
  action,
  title,
  description,
  confirmText = "Sim, excluir",
  successMessage,
  variant = "destructive",
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setPending(true)
    const result = await action()
    setPending(false)

    if (!result) {
      setOpen(false)
      return
    }

    if (!result.success) {
      toast.error(result.error)
      return
    }

    if (successMessage) toast.success(successMessage)
    setOpen(false)

    if (result.redirectTo) {
      router.push(result.redirectTo)
    }
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={children} />
      <AlertDialogContent size={variant === "default" ? "sm" : undefined} className="top-1/2 left-1/2 bottom-auto -translate-x-1/2 -translate-y-1/2 rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button variant={variant} disabled={pending} onClick={handleSubmit} className="cursor-pointer">
            {pending ? "Aguarde..." : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
