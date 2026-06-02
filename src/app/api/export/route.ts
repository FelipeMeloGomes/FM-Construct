import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

import { requireAuthApi } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { gerarTxt } from "@/lib/export/txt"
import { gerarCsv } from "@/lib/export/csv"
import { gerarPdf } from "@/lib/export/pdf"

const EXPORT_TYPES = ["geral", "trabalhadores", "despesas"] as const
type ExportType = (typeof EXPORT_TYPES)[number]

const EXPORT_FORMATS = ["txt", "csv", "pdf"] as const
type ExportFormat = (typeof EXPORT_FORMATS)[number]

function isValid<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.includes(value as T)
}

export async function GET(request: NextRequest) {
  if (!(await requireAuthApi(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = request.nextUrl
  const rawType = searchParams.get("type") || "geral"
  const type: ExportType = isValid(rawType, EXPORT_TYPES) ? rawType : "geral"
  const rawFormat = searchParams.get("format") || "txt"
  const format: ExportFormat = isValid(rawFormat, EXPORT_FORMATS) ? rawFormat : "txt"
  const rawMes = searchParams.get("mes")
  const mes = rawMes && /^\d{4}-\d{2}$/.test(rawMes) ? rawMes : null

  logAudit("exportar", `Formato: ${format}, Tipo: ${type}${mes ? `, Mês: ${mes}` : ""}`)

  if (format === "txt") {
    const content = await gerarTxt(type, mes)
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="fm-construct-${type}.txt"`,
      },
    })
  }

  if (format === "csv") {
    const content = await gerarCsv(type, mes)
    return new Response(content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fm-construct-${type}.csv"`,
      },
    })
  }

  const pdfBytes = await gerarPdf(type, mes)
  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fm-construct-${type}.pdf"`,
    },
  })
}
