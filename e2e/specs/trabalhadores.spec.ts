import { test, expect } from "../fixtures"
import { TrabalhadoresPage } from "../pages/TrabalhadoresPage"
import { closePool } from "../helpers/db"

test.describe("Trabalhadores", () => {
  let trabalhadoresPage: TrabalhadoresPage

  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page, loggedInPage }) => {
    await loggedInPage
    trabalhadoresPage = new TrabalhadoresPage(page)
  })

  test("deve exibir estado vazio quando não há trabalhadores cadastrados", async ({ page }) => {
    await trabalhadoresPage.goto()
    await expect(trabalhadoresPage.getMensagemVazia()).toBeVisible()
  })

  test("deve cadastrar um novo trabalhador", async ({ page }) => {
    const nome = `João Silva ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "180.00")
    await page.waitForURL("/trabalhadores")

    await expect(trabalhadoresPage.getRowByName(nome)).toBeVisible()
  })

  test("deve editar um trabalhador existente", async ({ page }) => {
    const nome = `Carlos Santos ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Servente", "120.00")
    await page.waitForURL("/trabalhadores")

    await trabalhadoresPage.clicarEditar(nome)
    await page.waitForURL(/\/editar/)

    const campos = page.getByLabel("Nome completo")
    await campos.clear()
    await campos.fill(`${nome} (editado)`)
    await trabalhadoresPage.submeterEdicao()

    await expect(page.getByText(`${nome} (editado)`)).toBeVisible()
  })

  test("deve excluir um trabalhador", async ({ page }) => {
    const nome = `Pedro Alves ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await trabalhadoresPage.clicarExcluir(nome)

    await expect(trabalhadoresPage.getRowByName(nome)).not.toBeVisible()
  })

  test("deve buscar trabalhador pelo nome", async ({ page }) => {
    const nome = `Busca Nome ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Servente", "100.00")
    await page.waitForURL("/trabalhadores")

    await trabalhadoresPage.buscar(nome)
    await expect(trabalhadoresPage.getRowByName(nome)).toBeVisible()
  })

  test("deve mostrar nenhum resultado para busca sem match", async ({ page }) => {
    const nome = `Sem Match ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await trabalhadoresPage.buscar("ZZZZ_NAO_EXISTE")
    await expect(page.getByText("Nenhum trabalhador encontrado")).toBeVisible()
  })

  test("deve ordenar por nome ascendente e descendente", async ({ page }) => {
    await trabalhadoresPage.criarTrabalhador(`Ana ${Date.now()}`, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")
    await trabalhadoresPage.criarTrabalhador(`Bruno ${Date.now()}`, "Servente", "150.00")
    await page.waitForURL("/trabalhadores")
    await trabalhadoresPage.criarTrabalhador(`Carlos ${Date.now()}`, "Pedreiro", "180.00")
    await page.waitForURL("/trabalhadores")

    await trabalhadoresPage.ordenarPor("Nome")
    const primeiroAsc = await trabalhadoresPage.getNomePrimeiraLinha()
    expect(primeiroAsc).toMatch(/^Ana/)

    await trabalhadoresPage.ordenarPor("Nome")
    const primeiroDesc = await trabalhadoresPage.getNomePrimeiraLinha()
    expect(primeiroDesc).toMatch(/^Carlos/)
  })

  test("deve ordenar por status ascendente e descendente", async ({ page }) => {
    const nome = `Status Test ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await trabalhadoresPage.ordenarPor("Status")
    const nomeAsc = await trabalhadoresPage.getNomePrimeiraLinha()
    expect(nomeAsc).toBe(nome)

    await trabalhadoresPage.ordenarPor("Status")
    const nomeDesc = await trabalhadoresPage.getNomePrimeiraLinha()
    expect(nomeDesc).toBe(nome)
  })

  test("deve limpar busca com botão X", async ({ page }) => {
    const nome = `Limpa Busca ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await trabalhadoresPage.buscar(nome)
    await expect(trabalhadoresPage.getRowByName(nome)).toBeVisible()

    await trabalhadoresPage.limparBusca()
    await expect(trabalhadoresPage.getRowByName(nome)).toBeVisible()
  })
})
