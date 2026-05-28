/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

import { getDb } from "@/lib/db"
async function sqlQuery(strings: TemplateStringsArray, ...values: any[]) {
  const db = await getDb()
  return db(strings, ...values)
}

function formatarData(data: string | Date): string {
  return new Date(data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get("type") || "geral"
  const format = searchParams.get("format") || "txt"
  const mes = searchParams.get("mes")

  if (format === "txt") {
    const content = await gerarTxt(type, mes)
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="fm-construct-${type}.txt"`,
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

async function gerarTxt(type: string, mes: string | null): Promise<string> {
  const lines: string[] = []
  const sep = "=".repeat(60)
  const sub = "-".repeat(40)

  const tituloMes = mes
    ? ` - ${new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
    : ""

  lines.push(sep)
  lines.push(`  FM-CONSTRUCT - RELAT\u00d3RIO DE OBRA${tituloMes}`)
  lines.push(`  Gerado em: ${formatarData(new Date())}`)
  lines.push(sep)
  lines.push("")

  if (type === "trabalhadores" || type === "geral") {
    const trabalhadores = await sqlQuery`SELECT * FROM trabalhadores ORDER BY nome`

    const dias = mes
      ? await sqlQuery`
        SELECT d.*, t.nome as trabalhador_nome
        FROM dias_trabalhados d
        JOIN trabalhadores t ON t.id = d.trabalhador_id
        WHERE d.data >= ${`${mes}-01`}::date
          AND d.data < (${`${mes}-01`}::date + interval '1 month')
        ORDER BY t.nome, d.data DESC
      `
      : await sqlQuery`
        SELECT d.*, t.nome as trabalhador_nome
        FROM dias_trabalhados d
        JOIN trabalhadores t ON t.id = d.trabalhador_id
        ORDER BY t.nome, d.data DESC
      `

    lines.push("  TRABALHADORES")
    lines.push(sub)

    for (const t of trabalhadores) {
      lines.push(`  Nome: ${t.nome}`)
      lines.push(`  Fun\u00e7\u00e3o: ${t.funcao}`)
      lines.push(`  Di\u00e1ria: R$ ${Number(t.valor_diaria).toFixed(2)}`)
      lines.push(`  Status: ${t.ativo ? "Ativo" : "Inativo"}`)
      lines.push("")

      const diasTrab = dias.filter((d: any) => d.trabalhador_id === t.id)
      if (diasTrab.length > 0) {
        lines.push("    Dias trabalhados:")
        for (const d of diasTrab) {
          const data = formatarData(d.data)
          const tipo = d.tipo === "inteiro" ? "Dia inteiro" : "Meio dia"
          const status = d.pago && Number(d.valor_pago ?? 0) >= Number(d.valor_dia) ? "Pago" : d.pago ? "Parcial" : "Pendente"
          lines.push(`    - ${data} | ${tipo} | R$ ${Number(d.valor_dia).toFixed(2)} | ${status}`)
        }

        const total = diasTrab.reduce((acc: number, d: any) => acc + Number(d.valor_dia), 0)
        const pago = diasTrab.filter((d: any) => d.pago).reduce((acc: number, d: any) => acc + Number(d.valor_pago), 0)
        lines.push(`    Total: R$ ${total.toFixed(2)} | Pago: R$ ${pago.toFixed(2)}`)
      }
      lines.push("")
    }
  }

  if (type === "despesas" || type === "geral") {
    const despesas = mes
      ? await sqlQuery`
        SELECT * FROM despesas
        WHERE data >= ${`${mes}-01`}::date
          AND data < (${`${mes}-01`}::date + interval '1 month')
        ORDER BY data DESC
      `
      : await sqlQuery`SELECT * FROM despesas ORDER BY data DESC`

    lines.push("  DESPESAS")
    lines.push(sub)

    let totalDespesas = 0
    for (const d of despesas) {
      const data = formatarData(d.data)
      lines.push(`  ${data} | ${d.descricao} | ${d.categoria} | R$ ${Number(d.valor).toFixed(2)}${d.pago_para ? ` | ${d.pago_para}` : ""}`)
      totalDespesas += Number(d.valor)
    }
    lines.push("")
    lines.push(`  Total de Despesas: R$ ${totalDespesas.toFixed(2)}`)
    lines.push("")
  }

  if (type === "geral") {
    lines.push(sep)
    const resumoDias = mes
      ? await sqlQuery`
        SELECT
          COALESCE(SUM(COALESCE(valor_pago, 0))::decimal, 0) as total_pago,
          COALESCE(SUM(valor_dia - COALESCE(valor_pago, 0))::decimal, 0) as total_pendente
        FROM dias_trabalhados
        WHERE data >= ${`${mes}-01`}::date
          AND data < (${`${mes}-01`}::date + interval '1 month')
      `
      : await sqlQuery`
        SELECT
          COALESCE(SUM(COALESCE(valor_pago, 0))::decimal, 0) as total_pago,
          COALESCE(SUM(valor_dia - COALESCE(valor_pago, 0))::decimal, 0) as total_pendente
        FROM dias_trabalhados
      `
    const totalDespesas = mes
      ? await sqlQuery`
        SELECT COALESCE(SUM(valor)::decimal, 0) as total FROM despesas
        WHERE data >= ${`${mes}-01`}::date
          AND data < (${`${mes}-01`}::date + interval '1 month')
      `
      : await sqlQuery`SELECT COALESCE(SUM(valor)::decimal, 0) as total FROM despesas`

    lines.push("  RESUMO FINANCEIRO")
    lines.push(sub)
    lines.push(`  Total Pago (trabalhadores): R$ ${Number(resumoDias[0].total_pago).toFixed(2)}`)
    lines.push(`  Total Pendente: R$ ${Number(resumoDias[0].total_pendente).toFixed(2)}`)
    lines.push(`  Total Despesas: R$ ${Number(totalDespesas[0].total).toFixed(2)}`)
    lines.push(sep)
  }

  return lines.join("\r\n")
}

async function gerarPdf(type: string, mes: string | null): Promise<ArrayBuffer> {
  const jsPDF = (await import("jspdf")).default
  const autoTable = (await import("jspdf-autotable")).default

  const doc = new jsPDF()
  let y = 20

  const tituloMes = mes
    ? ` - ${new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
    : ""

  doc.setFontSize(16)
  doc.text(`FM-Construct - Relat\u00f3rio de Obra${tituloMes}`, 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(`Gerado em: ${formatarData(new Date())}`, 14, y)
  y += 12

  if (type === "trabalhadores" || type === "geral") {
    const trabalhadores = await sqlQuery`SELECT * FROM trabalhadores ORDER BY nome`

    for (const t of trabalhadores) {
      if (y > 250) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(12)
      doc.text(`${t.nome} (${t.funcao}) - Di\u00e1ria: R$ ${Number(t.valor_diaria).toFixed(2)}`, 14, y)
      y += 6

      const dias = mes
        ? await sqlQuery`
          SELECT * FROM dias_trabalhados
          WHERE trabalhador_id = ${t.id}
            AND data >= ${`${mes}-01`}::date
            AND data < (${`${mes}-01`}::date + interval '1 month')
          ORDER BY data DESC
        `
        : await sqlQuery`
          SELECT * FROM dias_trabalhados
          WHERE trabalhador_id = ${t.id}
          ORDER BY data DESC
        `

      if (dias.length > 0) {
        const body = dias.map((d: any) => [
          formatarData(d.data),
          d.tipo === "inteiro" ? "Dia inteiro" : "Meio dia",
          `R$ ${Number(d.valor_dia).toFixed(2)}`,
          d.pago && Number(d.valor_pago ?? 0) >= Number(d.valor_dia) ? "Pago" : d.pago ? "Parcial" : "Pendente",
          d.valor_pago ? `R$ ${Number(d.valor_pago).toFixed(2)}` : "-",
        ])

        autoTable(doc, {
          startY: y,
          head: [["Data", "Tipo", "Valor", "Status", "Pago"]],
          body,
          styles: { fontSize: 8 },
          theme: "grid",
        })
        y = (doc as any).lastAutoTable.finalY + 8
      } else {
        doc.setFontSize(10)
        doc.text("Nenhum dia registrado", 18, y)
        y += 8
      }
    }
  }

  if (type === "despesas" || type === "geral") {
    if (y > 230) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(14)
    doc.text("Despesas", 14, y)
    y += 8

    const despesas = mes
      ? await sqlQuery`
        SELECT * FROM despesas
        WHERE data >= ${`${mes}-01`}::date
          AND data < (${`${mes}-01`}::date + interval '1 month')
        ORDER BY data DESC
      `
      : await sqlQuery`SELECT * FROM despesas ORDER BY data DESC`

    if (despesas.length > 0) {
      const body = despesas.map((d: any) => [
        formatarData(d.data),
        d.descricao,
        d.categoria,
        `R$ ${Number(d.valor).toFixed(2)}`,
      ])

      autoTable(doc, {
        startY: y,
        head: [["Data", "Descri\u00e7\u00e3o", "Categoria", "Valor"]],
        body,
        styles: { fontSize: 8 },
        theme: "grid",
      })
    }
  }

  return doc.output("arraybuffer")
}
