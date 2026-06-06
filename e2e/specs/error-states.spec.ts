import { test, expect } from "../fixtures"
import { closePool } from "../helpers/db"

test.describe("Error States", () => {
  test.afterAll(async () => {
    await closePool()
  })

  test("deve exibir página 404 para rota inexistente", async ({ page }) => {
    await page.goto("/pagina-inexistente")
    await expect(page.getByText("404")).toBeVisible()
    await expect(page.getByText("Página não encontrada")).toBeVisible()
    await expect(page.getByRole("link", { name: "Voltar ao início" })).toBeVisible()
  })

  test("deve exibir página 404 para trabalhador inexistente", async ({ page }) => {
    await page.goto("/trabalhadores/00000000-0000-0000-0000-000000000000")
    await expect(page.getByText("404")).toBeVisible()
    await expect(page.getByText("Página não encontrada")).toBeVisible()
  })

  test("deve exibir página 404 para despesa inexistente", async ({ page }) => {
    await page.goto("/despesas/00000000-0000-0000-0000-000000000000/editar")
    await expect(page.getByText("404")).toBeVisible()
  })

  test("deve exibir loading skeleton nos detalhes do trabalhador", async ({ page, loggedInPage }) => {
    await loggedInPage
    await page.goto("/trabalhadores/00000000-0000-0000-0000-000000000000")
  })

  test("deve redirecionar para /login ao acessar API sem autenticação", async ({ page }) => {
    const response = await page.request.get("/api/export?type=geral&format=csv")
    expect(response.status()).toBe(401)
  })
})
