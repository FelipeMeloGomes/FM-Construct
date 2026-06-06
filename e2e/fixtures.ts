import { test as base, expect } from "@playwright/test"
import { LoginPage } from "./pages/LoginPage"
import { cleanTestDatabase, seedTestDatabase } from "./helpers/db"

export { expect }

type MyFixtures = {
  loggedInPage: boolean
}

export const test = base.extend<MyFixtures>({
  loggedInPage: [
    async ({ page }, use) => {
      await cleanTestDatabase()
      await seedTestDatabase()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(
        process.env.AUTH_USER || "admin",
        process.env.AUTH_PASS || "",
      )
      await expect(page).toHaveURL("/", { timeout: 15_000 })

      await use(true)
    },
    { auto: false },
  ],
})
