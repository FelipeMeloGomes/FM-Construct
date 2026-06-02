import { sqlQuery, formatarData } from "./shared"

function escapeCsv(value: string): string {
  let sanitized = value
  if (/^[=+\-@]/.test(sanitized)) {
    sanitized = "'" + sanitized
  }
  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return `"${sanitized.replace(/"/g, '""')}"`
  }
  return sanitized
}

export async function gerarCsv(type: string, mes: string | null): Promise<string> {
  const lines: string[] = []

  lines.push("\uFEFF")

  if (type === "trabalhadores" || type === "geral") {
    const dias = mes
      ? await sqlQuery`
        SELECT d.*, t.nome as trabalhador_nome, t.funcao
        FROM dias_trabalhados d
        JOIN trabalhadores t ON t.id = d.trabalhador_id
        WHERE d.data >= ${`${mes}-01`}::date
          AND d.data < (${`${mes}-01`}::date + interval '1 month')
        ORDER BY t.nome, d.data DESC
      `
      : await sqlQuery`
        SELECT d.*, t.nome as trabalhador_nome, t.funcao
        FROM dias_trabalhados d
        JOIN trabalhadores t ON t.id = d.trabalhador_id
        ORDER BY t.nome, d.data DESC
      `

    lines.push(escapeCsv("Data") + "," + escapeCsv("Trabalhador") + "," + escapeCsv("Função") + "," + escapeCsv("Tipo") + "," + escapeCsv("Valor Dia") + "," + escapeCsv("Status") + "," + escapeCsv("Valor Pago"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const d of dias as any[]) {
      const data = formatarData(d.data)
      const tipo = d.tipo === "inteiro" ? "Dia inteiro" : "Meio dia"
      const status = d.pago && Number(d.valor_pago ?? 0) >= Number(d.valor_dia) ? "Pago" : d.pago ? "Parcial" : "Pendente"
      const valorPago = d.valor_pago ? `R$ ${Number(d.valor_pago).toFixed(2)}` : "Sem pgto"
      lines.push(escapeCsv(data) + "," + escapeCsv(d.trabalhador_nome) + "," + escapeCsv(d.funcao) + "," + escapeCsv(tipo) + "," + escapeCsv(`R$ ${Number(d.valor_dia).toFixed(2)}`) + "," + escapeCsv(status) + "," + escapeCsv(valorPago))
    }

    if (type === "trabalhadores") return lines.join("\r\n")
    lines.push("")
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

    lines.push(escapeCsv("Data") + "," + escapeCsv("Descrição") + "," + escapeCsv("Categoria") + "," + escapeCsv("Valor"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const d of despesas as any[]) {
      const data = formatarData(d.data)
      lines.push(escapeCsv(data) + "," + escapeCsv(d.descricao) + "," + escapeCsv(d.categoria) + "," + escapeCsv(`R$ ${Number(d.valor).toFixed(2)}`))
    }
  }

  return lines.join("\r\n")
}
