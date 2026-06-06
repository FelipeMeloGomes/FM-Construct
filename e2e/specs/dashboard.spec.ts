import { test, expect } from "../fixtures"
import { DashboardPage } from "../pages/DashboardPage"
import { TrabalhadoresPage } from "../pages/TrabalhadoresPage"
import { DespesasPage } from "../pages/DespesasPage"
import { closePool } from "../helpers/db"

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
    await page.waitForTimeout(1_000)

    const temVazio = await dashboardPage.getEmptyMessage()
    expect(temVazio).toBeNull()

    const trabalhadoresValor = await dashboardPage.getCardValue("Trabalhadores Ativos")
    expect(trabalhadoresValor).toBe("1")

    const despesasValor = await dashboardPage.getCardValue("Total Despesas")
    expect(despesasValor.replace(/\s/g, " ")).toBe("R$ 500,00")

    const temCustoTotal = await dashboardPage.hasCustoTotal()
    expect(temCustoTotal).toBe(true)
  })
})
