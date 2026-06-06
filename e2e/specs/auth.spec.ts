import { test, expect } from "../fixtures"
import { LoginPage } from "../pages/LoginPage"
import { cleanTestDatabase, closePool } from "../helpers/db"

test.describe("Autenticação", () => {
  let loginPage: LoginPage

  test.beforeAll(async () => {
    await cleanTestDatabase()
  })

  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
  })

  test("deve exibir página de login com elementos corretos", async ({ page }) => {
    await loginPage.goto()
    await expect(page.getByRole("heading", { name: /FM-Construct/ })).toBeVisible()
    await expect(page.getByText("Acesso restrito")).toBeVisible()
    await expect(page.locator("#username")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible()
  })

  test("deve alternar visibilidade da senha", async ({ page }) => {
    await loginPage.goto()
    const passwordInput = page.locator("#password")
    await expect(passwordInput).toHaveAttribute("type", "password")

    await page.getByRole("button", { name: "Mostrar senha" }).click()
    await expect(passwordInput).toHaveAttribute("type", "text")

    await page.getByRole("button", { name: "Esconder senha" }).click()
    await expect(passwordInput).toHaveAttribute("type", "password")
  })

  test("deve redirecionar para /login ao acessar rota protegida", async ({ page }) => {
    await page.goto("/trabalhadores")
    await expect(page).toHaveURL(/\/login/)
  })

  test("deve fazer login com credenciais válidas", async ({ page }) => {
    await loginPage.goto()
    await loginPage.login(
      process.env.AUTH_USER || "admin",
      process.env.AUTH_PASS || "",
    )
    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  })

  test("deve exibir erro com credenciais inválidas", async ({ page }) => {
    await loginPage.goto()
    await loginPage.login("admin", "senha_errada")
    await expect(page.getByText("Credenciais inválidas")).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test("deve fazer logout com sucesso", async ({ page }) => {
    await loginPage.goto()
    await loginPage.login(
      process.env.AUTH_USER || "admin",
      process.env.AUTH_PASS || "",
    )
    await expect(page).toHaveURL("/")

    await page.getByRole("button", { name: "Sair" }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test("deve redirecionar de volta à página original após login", async ({ page }) => {
    await page.goto("/despesas")
    await expect(page).toHaveURL(/\/login.*redirect.*despesas/)

    await loginPage.login(
      process.env.AUTH_USER || "admin",
      process.env.AUTH_PASS || "",
    )
    await expect(page).toHaveURL("/despesas")
  })
})
