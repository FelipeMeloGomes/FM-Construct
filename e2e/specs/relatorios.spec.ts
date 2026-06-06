import { test, expect } from "../fixtures"
import { RelatoriosPage } from "../pages/RelatoriosPage"
import { TrabalhadoresPage } from "../pages/TrabalhadoresPage"
import { DespesasPage } from "../pages/DespesasPage"
import { closePool } from "../helpers/db"

test.describe("Relatórios", () => {
  let relatoriosPage: RelatoriosPage

  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page, loggedInPage }) => {
    await loggedInPage
    relatoriosPage = new RelatoriosPage(page)
  })

  test("deve exibir estado vazio quando não há dados", async ({ page }) => {
    await relatoriosPage.goto()
    const msg = await relatoriosPage.getEmptyMessage()
    expect(msg).toBe("Nenhum dado cadastrado")
  })

  test("deve exibir resumo e botões de exportação após cadastrar dados", async ({ page }) => {
    const trabalhadoresPage = new TrabalhadoresPage(page)
    const despesasPage = new DespesasPage(page)

    const nome = `Maria Rel ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await despesasPage.criarDespesa(`Cimento ${Date.now()}`, "Material", "350.00")
    await page.waitForURL("/despesas")

    await relatoriosPage.goto()
    await page.waitForLoadState("networkidle")

    const titulo = await relatoriosPage.getSectionTitle()
    expect(titulo).toBe("Relatórios")

    const vazio = await relatoriosPage.getEmptyMessage()
    expect(vazio).toBeNull()

    await expect(relatoriosPage.getExportLink("trabalhadores", "pdf")).toBeVisible()
    await expect(relatoriosPage.getExportLink("trabalhadores", "txt")).toBeVisible()
    await expect(relatoriosPage.getExportLink("trabalhadores", "csv")).toBeVisible()
    await expect(relatoriosPage.getExportLink("despesas", "pdf")).toBeVisible()
    await expect(relatoriosPage.getExportLink("despesas", "txt")).toBeVisible()
    await expect(relatoriosPage.getExportLink("despesas", "csv")).toBeVisible()
    await expect(relatoriosPage.getExportLink("geral", "pdf")).toBeVisible()
    await expect(relatoriosPage.getExportLink("geral", "txt")).toBeVisible()
    await expect(relatoriosPage.getExportLink("geral", "csv")).toBeVisible()
  })

  test("deve exibir filtro de mês e aplicá-lo", async ({ page }) => {
    const trabalhadoresPage = new TrabalhadoresPage(page)
    await trabalhadoresPage.criarTrabalhador("Filtro Mes", "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await relatoriosPage.goto()
    await page.waitForLoadState("networkidle")

    const hasFilter = await relatoriosPage.isMonthFilterVisible()
    expect(hasFilter).toBe(true)

    const hoje = new Date()
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
    await relatoriosPage.selectMonth(mesAtual)
    await page.waitForURL(/\?mes=/)
    await page.waitForLoadState("networkidle")

    await expect(relatoriosPage.getExportLink("trabalhadores", "pdf")).toBeVisible()
  })

  test("export CSV deve iniciar download para tipo trabalhadores", async ({ page }) => {
    const trabalhadoresPage = new TrabalhadoresPage(page)
    await trabalhadoresPage.criarTrabalhador("Export Test", "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await relatoriosPage.goto()
    await page.waitForLoadState("networkidle")

    const downloadPromise = page.waitForEvent("download", { timeout: 10_000 })
    await relatoriosPage.clickExport("trabalhadores", "csv")
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain(".csv")
  })

  test("export TXT deve iniciar download para tipo despesas", async ({ page }) => {
    const despesasPage = new DespesasPage(page)
    await despesasPage.criarDespesa("Export Despesa", "Material", "500.00")
    await page.waitForURL("/despesas")

    await relatoriosPage.goto()
    await page.waitForLoadState("networkidle")

    const downloadPromise = page.waitForEvent("download", { timeout: 10_000 })
    await relatoriosPage.clickExport("despesas", "txt")
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain(".txt")
  })
})
