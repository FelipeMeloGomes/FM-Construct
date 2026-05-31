import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

import { requireAuthApi } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { gerarTxt } from "@/lib/export/txt"
import { gerarCsv } from "@/lib/export/csv"
import { gerarPdf } from "@/lib/export/pdf"

export async function GET(request: NextRequest) {
  if (!(await requireAuthApi(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = request.nextUrl
  const type = searchParams.get("type") || "geral"
  const format = searchParams.get("format") || "txt"
  const mes = searchParams.get("mes")

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
