import { sqlQuery, formatarData, formatarMes } from "./shared"

export async function gerarTxt(type: string, mes: string | null): Promise<string> {
  const lines: string[] = []
  const sep = "=".repeat(60)
  const sub = "-".repeat(40)

  const tituloMes = formatarMes(mes)

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const t of trabalhadores as any[]) {
      lines.push(`  Nome: ${t.nome}`)
      lines.push(`  Fun\u00e7\u00e3o: ${t.funcao}`)
      lines.push(`  Di\u00e1ria: R$ ${Number(t.valor_diaria).toFixed(2)}`)
      lines.push(`  Status: ${t.ativo ? "Ativo" : "Inativo"}`)
      lines.push("")

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const diasTrab = dias.filter((d: any) => d.trabalhador_id === t.id) as any[]
      if (diasTrab.length > 0) {
        lines.push("    Dias trabalhados:")
        for (const d of diasTrab) {
          const data = formatarData(d.data)
          const tipo = d.tipo === "inteiro" ? "Dia inteiro" : "Meio dia"
          const status = d.pago && Number(d.valor_pago ?? 0) >= Number(d.valor_dia) ? "Pago" : d.pago ? "Parcial" : "Pendente"
          lines.push(`    - ${data} | ${tipo} | R$ ${Number(d.valor_dia).toFixed(2)} | ${status}`)
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const total = diasTrab.reduce((acc: number, d: any) => acc + Number(d.valor_dia), 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const d of despesas as any[]) {
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
