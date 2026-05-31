import { sqlQuery, formatarData, formatarMes } from "./shared"

export async function gerarPdf(type: string, mes: string | null): Promise<ArrayBuffer> {
  const jsPDF = (await import("jspdf")).default
  const autoTable = (await import("jspdf-autotable")).default

  const doc = new jsPDF()
  let y = 20

  const tituloMes = formatarMes(mes)

  doc.setFontSize(16)
  doc.text(`FM-Construct - Relat\u00f3rio de Obra${tituloMes}`, 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(`Gerado em: ${formatarData(new Date())}`, 14, y)
  y += 12

  if (type === "trabalhadores" || type === "geral") {
    const trabalhadores = await sqlQuery`SELECT * FROM trabalhadores ORDER BY nome`

    const todosDias = mes
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const t of trabalhadores as any[]) {
      if (y > 250) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(12)
      doc.text(`${t.nome} (${t.funcao}) - Di\u00e1ria: R$ ${Number(t.valor_diaria).toFixed(2)}`, 14, y)
      y += 6

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dias = (todosDias as any[]).filter((d: any) => d.trabalhador_id === t.id)

      if (dias.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = dias.map((d: any) => [
          formatarData(d.data),
          d.tipo === "inteiro" ? "Dia inteiro" : "Meio dia",
          `R$ ${Number(d.valor_dia).toFixed(2)}`,
          d.pago && Number(d.valor_pago ?? 0) >= Number(d.valor_dia) ? "Pago" : d.pago ? "Parcial" : "Pendente",
          d.valor_pago ? `R$ ${Number(d.valor_pago).toFixed(2)}` : "Sem pgto",
        ])

        autoTable(doc, {
          startY: y,
          head: [["Data", "Tipo", "Valor", "Status", "Pago"]],
          body,
          styles: { fontSize: 8 },
          theme: "grid",
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
