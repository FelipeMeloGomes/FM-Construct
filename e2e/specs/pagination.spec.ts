import { test, expect } from "../fixtures"
import { insertManyTrabalhadores, insertManyDespesas, cleanTestDatabase, closePool } from "../helpers/db"

test.describe("Paginação", () => {
  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async () => {
    await cleanTestDatabase()
  })

  test("deve paginar lista de trabalhadores com mais de 20 registros", async ({ page, loggedInPage }) => {
    await loggedInPage
    await insertManyTrabalhadores(25)

    await page.goto("/trabalhadores")
    await page.waitForLoadState("networkidle")

    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(20)

    await page.getByRole("button", { name: "Próxima" }).click()
    await expect(rows).toHaveCount(5)

    await page.getByRole("button", { name: "Anterior" }).click()
    await expect(rows).toHaveCount(20)
  })

  test("deve paginar lista de despesas com mais de 20 registros", async ({ page, loggedInPage }) => {
    await loggedInPage
    await insertManyDespesas(25)

    await page.goto("/despesas")
    await page.waitForLoadState("networkidle")

    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(20)

    await page.getByRole("button", { name: "Próxima" }).click()
    await expect(rows).toHaveCount(5)
  })
})
