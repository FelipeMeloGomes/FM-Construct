import { test, expect } from "../fixtures"
import { LoginPage } from "../pages/LoginPage"
import { cleanTestDatabase, closePool } from "../helpers/db"

test.describe("Rate Limiting", () => {
  let loginPage: LoginPage

  test.beforeAll(async () => {
    await cleanTestDatabase()
  })

  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test("deve exibir erro para credenciais inválidas", async ({ page }) => {
    await loginPage.login("admin", "senha_errada")
    await expect(page.getByText("Credenciais inválidas")).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test("deve bloquear após múltiplas tentativas inválidas consecutivas", async ({ page }) => {
    for (let i = 0; i < 11; i++) {
      await page.locator("#username").fill("admin")
      await page.locator("#password").fill(`wrong_${i}`)
      await page.getByRole("button", { name: "Entrar" }).click()
    }

    await expect(page.getByText("Muitas tentativas")).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
