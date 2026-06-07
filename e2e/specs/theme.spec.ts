import { test, expect } from "../fixtures"
import { closePool } from "../helpers/db"

test.describe("Theme Toggle", () => {
  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page, loggedInPage }) => {
    await loggedInPage
  })

  test("deve alternar entre tema claro e escuro", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Ativar modo escuro|Ativar modo claro/ })
    await expect(toggle).toBeVisible()

    const initialAriaLabel = await toggle.getAttribute("aria-label")
    if (initialAriaLabel === "Ativar modo escuro") {
      await expect(page.locator("html")).not.toHaveAttribute("class", /dark/)
    } else {
      await expect(page.locator("html")).toHaveAttribute("class", /dark/)
    }

    await toggle.click()

    await expect(toggle).toHaveAttribute("aria-label", initialAriaLabel === "Ativar modo escuro" ? "Ativar modo claro" : "Ativar modo escuro")

    const afterClickLabel = await toggle.getAttribute("aria-label")
    if (afterClickLabel === "Ativar modo escuro") {
      await expect(page.locator("html")).not.toHaveAttribute("class", /dark/)
    } else {
      await expect(page.locator("html")).toHaveAttribute("class", /dark/)
    }
  })

  test("deve persistir tema ao navegar entre páginas", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Ativar modo escuro|Ativar modo claro/ })
    const initialLabel = await toggle.getAttribute("aria-label")

    await toggle.click()

    await expect(toggle).toHaveAttribute("aria-label", initialLabel === "Ativar modo escuro" ? "Ativar modo claro" : "Ativar modo escuro")

    await page.getByRole("link", { name: "Despesas" }).click()
    await page.waitForURL("/despesas")

    const toggleAfterNav = page.getByRole("button", { name: /Ativar modo escuro|Ativar modo claro/ })
    const afterNavLabel = await toggleAfterNav.getAttribute("aria-label")
    expect(afterNavLabel).not.toBe(initialLabel)
  })
})
