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
})
