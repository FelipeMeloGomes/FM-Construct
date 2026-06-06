import type { Page } from "@playwright/test"

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login")
  }

  async login(username: string, password: string) {
    await this.page.locator("#username").fill(username)
    await this.page.locator("#password").fill(password)
    await this.page.getByRole("button", { name: "Entrar" }).click()
  }

  async getErrorMessage() {
    return this.page.locator("text=Credenciais inválidas")
  }

  async isLoginPage() {
    return this.page.url().includes("/login")
  }
}
