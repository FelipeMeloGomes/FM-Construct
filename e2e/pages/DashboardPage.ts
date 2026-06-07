import type { Page } from "@playwright/test"

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/")
  }

  async getEmptyMessage(): Promise<string | null> {
    const el = this.page.getByText("Bem-vindo ao FM-Construct")
    try {
      await el.waitFor({ timeout: 5_000 })
      return await el.innerText()
    } catch {
      return null
    }
  }

  async getCardValue(titulo: string): Promise<string> {
    const card = this.page
      .locator('[data-slot="card"]')
      .filter({ has: this.page.locator(`[data-slot="card-title"]`, { hasText: titulo }) })
    return (await card.locator(".text-2xl").innerText()).trim()
  }

  async getCustoTotal(): Promise<string> {
    const el = this.page.getByText("Custo Total da Obra")
    const card = el.locator("..").locator("..")
    const valor = card.locator(".text-3xl")
    return (await valor.innerText()).trim()
  }

  async hasCustoTotal(): Promise<boolean> {
    try {
      await this.page.getByText("Custo Total da Obra").waitFor({ timeout: 3_000 })
      return true
    } catch {
      return false
    }
  }

  async hasChart(titulo: string): Promise<boolean> {
    const card = this.page
      .locator('[data-slot="card"]')
      .filter({ has: this.page.locator(`[data-slot="card-title"]`, { hasText: titulo }) })
    try {
      await card.locator("canvas").waitFor({ timeout: 8_000 })
      return true
    } catch {
      return false
    }
  }

  async getChartEmptyMessage(titulo: string): Promise<string | null> {
    const card = this.page
      .locator('[data-slot="card"]')
      .filter({ has: this.page.locator(`[data-slot="card-title"]`, { hasText: titulo }) })
    try {
      const msg = card.locator("p").first()
      await msg.waitFor({ timeout: 5_000 })
      return await msg.innerText()
    } catch {
      return null
    }
  }

  async hasUltimosPagamentos(): Promise<boolean> {
    try {
      await this.page.getByText("Últimos Pagamentos").waitFor({ timeout: 3_000 })
      return true
    } catch {
      return false
    }
  }

  async ultimosPagamentosContem(nome: string): Promise<boolean> {
    try {
      const card = this.page.locator('[data-slot="card"]').filter({
        has: this.page.locator('[data-slot="card-title"]', { hasText: "Últimos Pagamentos" }),
      })
      await card.getByText(nome).waitFor({ timeout: 3_000 })
      return true
    } catch {
      return false
    }
  }
}
