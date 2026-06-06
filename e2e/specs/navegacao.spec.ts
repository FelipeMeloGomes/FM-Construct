import { test, expect } from "../fixtures"
import { LoginPage } from "../pages/LoginPage"
import { closePool } from "../helpers/db"

test.describe("Navegação", () => {
  let loginPage: LoginPage

  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page, loggedInPage }) => {
    await loggedInPage
    loginPage = new LoginPage(page)
  })

  test("header deve conter links de navegação e clicar em cada um", async ({ page }) => {
    const links = [
      { href: "/", ariaLabel: "Dashboard" },
      { href: "/trabalhadores", ariaLabel: "Trabalhadores" },
      { href: "/despesas", ariaLabel: "Despesas" },
      { href: "/relatorios", ariaLabel: "Relatórios" },
    ]

    for (const link of links) {
      const navLink = page.getByRole("link", { name: link.ariaLabel })
      await expect(navLink).toBeVisible()
      await navLink.click()
      await page.waitForURL(link.href === "/" ? /\/$/ : link.href)
      await expect(page).toHaveURL(new RegExp(link.href.replace("/", "\\/")))
    }
  })

  test("botão de logout deve redirecionar para /login", async ({ page }) => {
    await page.getByRole("button", { name: "Sair" }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test("deve redirecionar para /login ao acessar rota protegida sem autenticação", async ({ page, context }) => {
    await context.clearCookies()
    await page.goto("/trabalhadores")
    await expect(page).toHaveURL(/\/login/)

    await page.goto("/despesas")
    await expect(page).toHaveURL(/\/login/)

    await page.goto("/relatorios")
    await expect(page).toHaveURL(/\/login/)
  })

  test("login deve redirecionar para / ao acessar /login já autenticado", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveURL("/")
  })

  test("deve navegar pelo breadcrumb de voltar no detalhe do trabalhador", async ({ page }) => {
    await page.goto("/trabalhadores")
    await page.waitForURL("/trabalhadores")
    await expect(page.getByRole("heading", { name: "Trabalhadores" })).toBeVisible()
  })
})
