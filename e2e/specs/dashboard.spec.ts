import { test, expect } from "../fixtures"
import { DashboardPage } from "../pages/DashboardPage"
import { TrabalhadoresPage } from "../pages/TrabalhadoresPage"
import { TrabalhadorDetailPage } from "../pages/TrabalhadorDetailPage"
import { DespesasPage } from "../pages/DespesasPage"
import { closePool } from "../helpers/db"

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA")
}

test.describe("Dashboard", () => {
  let dashboardPage: DashboardPage

  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page, loggedInPage }) => {
    await loggedInPage
    dashboardPage = new DashboardPage(page)
  })

  test("deve exibir estado vazio quando não há dados", async ({ page }) => {
    await dashboardPage.goto()
    const msg = await dashboardPage.getEmptyMessage()
    expect(msg).toBe("Bem-vindo ao FM-Construct")
  })

  test("deve exibir cartões de resumo após cadastrar trabalhador e despesa", async ({ page }) => {
    const trabalhadoresPage = new TrabalhadoresPage(page)
    const despesasPage = new DespesasPage(page)

    const nome = `Maria Card ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await despesasPage.criarDespesa(`Cimento ${Date.now()}`, "Material", "500.00")
    await page.waitForURL("/despesas")

    await dashboardPage.goto()

    const temVazio = await dashboardPage.getEmptyMessage()
    expect(temVazio).toBeNull()

    const trabalhadoresValor = await dashboardPage.getCardValue("Trabalhadores Ativos")
    expect(trabalhadoresValor).toBe("1")

    const pagoValor = await dashboardPage.getCardValue("Total Pago")
    expect(pagoValor.replace(/\s/g, " ")).toBe("R$ 0,00")

    const pendenteValor = await dashboardPage.getCardValue("Total Pendente")
    expect(pendenteValor.replace(/\s/g, " ")).toBe("R$ 0,00")

    const despesasValor = await dashboardPage.getCardValue("Total Despesas")
    expect(despesasValor.replace(/\s/g, " ")).toBe("R$ 500,00")

    const temCustoTotal = await dashboardPage.hasCustoTotal()
    expect(temCustoTotal).toBe(true)

    const custoTotal = await dashboardPage.getCustoTotal()
    expect(custoTotal.replace(/\s/g, " ")).toBe("R$ 500,00")
  })

  test("deve exibir estado vazio dos gráficos quando só há trabalhador sem dias", async ({ page }) => {
    const trabalhadoresPage = new TrabalhadoresPage(page)

    const nome = `Grafico Vazio ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await dashboardPage.goto()

    const barMsg = await dashboardPage.getChartEmptyMessage("Evolução Mensal")
    expect(barMsg).toMatch(/Nenhum dado nos últimos/)

    const doughnutMsg = await dashboardPage.getChartEmptyMessage("Despesas por Categoria")
    expect(doughnutMsg).toBe("Nenhuma despesa registrada")
  })

  test("deve exibir gráficos com dados e últimos pagamentos", async ({ page }) => {
    const trabalhadoresPage = new TrabalhadoresPage(page)
    const despesasPage = new DespesasPage(page)

    const nome = `Completo ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await page.getByRole("link", { name: nome, exact: true }).click()
    await page.waitForURL(/\/trabalhadores\//)

    const detailPage = new TrabalhadorDetailPage(page)
    const hoje = todayISO()
    await detailPage.registrarDia(hoje, "inteiro")
    await detailPage.aguardarDiaRegistrado(hoje)

    await detailPage.pagarDia(hoje)
    await detailPage.aguardarDiaRegistrado(hoje)

    await despesasPage.criarDespesa(`Cimento ${Date.now()}`, "Material", "500.00")
    await page.waitForURL("/despesas")

    await dashboardPage.goto()

    const temVazio = await dashboardPage.getEmptyMessage()
    expect(temVazio).toBeNull()

    const trabalhadoresValor = await dashboardPage.getCardValue("Trabalhadores Ativos")
    expect(trabalhadoresValor).toBe("1")

    const pagoValor = await dashboardPage.getCardValue("Total Pago")
    expect(pagoValor.replace(/\s/g, " ")).toBe("R$ 200,00")

    const pendenteValor = await dashboardPage.getCardValue("Total Pendente")
    expect(pendenteValor.replace(/\s/g, " ")).toBe("R$ 0,00")

    const despesasValor = await dashboardPage.getCardValue("Total Despesas")
    expect(despesasValor.replace(/\s/g, " ")).toBe("R$ 500,00")

    const temCusto = await dashboardPage.hasCustoTotal()
    expect(temCusto).toBe(true)

    const custoTotal = await dashboardPage.getCustoTotal()
    expect(custoTotal.replace(/\s/g, " ")).toBe("R$ 700,00")

    const temBarChart = await dashboardPage.hasChart("Evolução Mensal")
    expect(temBarChart).toBe(true)

    const temDoughnut = await dashboardPage.hasChart("Despesas por Categoria")
    expect(temDoughnut).toBe(true)

    const temUltimos = await dashboardPage.hasUltimosPagamentos()
    expect(temUltimos).toBe(true)

    const temNome = await dashboardPage.ultimosPagamentosContem(nome)
    expect(temNome).toBe(true)
  })
})
