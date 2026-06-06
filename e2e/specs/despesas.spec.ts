import { test, expect } from "../fixtures"
import { DespesasPage } from "../pages/DespesasPage"
import { closePool } from "../helpers/db"

test.describe("Despesas", () => {
  let despesasPage: DespesasPage

  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page, loggedInPage }) => {
    await loggedInPage
    despesasPage = new DespesasPage(page)
  })

  test("deve registrar uma nova despesa", async ({ page }) => {
    const descricao = `Cimento ${Date.now()}`
    await despesasPage.criarDespesa(descricao, "Material", "350.00")
    await page.waitForURL("/despesas")

    await expect(despesasPage.getRowByDescricao(descricao)).toBeVisible()
  })

  test("deve editar uma despesa existente", async ({ page }) => {
    const descricao = `Ferro ${Date.now()}`
    await despesasPage.criarDespesa(descricao, "Material", "500.00")
    await page.waitForURL("/despesas")

    await despesasPage.clicarEditar(descricao)
    await page.waitForURL(/\/editar/)

    const campos = page.getByLabel("Descrição")
    await campos.clear()
    await campos.fill(`${descricao} (editado)`)
    await despesasPage.submeterEdicao()

    await expect(page.getByText(`${descricao} (editado)`)).toBeVisible()
  })

  test("deve excluir uma despesa", async ({ page }) => {
    const descricao = `Tijolos ${Date.now()}`
    await despesasPage.criarDespesa(descricao, "Material", "800.00")
    await page.waitForURL("/despesas")

    await despesasPage.clicarExcluir(descricao)

    await expect(despesasPage.getRowByDescricao(descricao)).not.toBeVisible()
  })

  test("deve excluir múltiplas despesas em lote", async ({ page }) => {
    const desc1 = `Despesa Lote A ${Date.now()}`
    const desc2 = `Despesa Lote B ${Date.now()}`

    await despesasPage.criarDespesa(desc1, "Material", "100.00")
    await page.waitForURL("/despesas")
    await despesasPage.criarDespesa(desc2, "Transporte", "200.00")
    await page.waitForURL("/despesas")

    await despesasPage.selecionarDespesa(desc1)
    await despesasPage.selecionarDespesa(desc2)

    await despesasPage.clicarExcluirSelecionados()

    await expect(despesasPage.getRowByDescricao(desc1)).not.toBeVisible()
    await expect(despesasPage.getRowByDescricao(desc2)).not.toBeVisible()
  })

  test("deve buscar despesa pela descrição", async ({ page }) => {
    const descricao = `Busca Despesa ${Date.now()}`
    await despesasPage.criarDespesa(descricao, "Ferramentas", "150.00")
    await page.waitForURL("/despesas")

    await despesasPage.buscar(descricao)
    await expect(despesasPage.getRowByDescricao(descricao)).toBeVisible()
  })

  test("deve mostrar nenhum resultado para busca sem match", async ({ page }) => {
    await despesasPage.criarDespesa(`Match Test ${Date.now()}`, "Material", "100.00")
    await page.waitForURL("/despesas")

    await despesasPage.buscar("ZZZZ_NAO_EXISTE")
    await expect(page.getByText("Nenhuma despesa encontrada")).toBeVisible()
  })
})
