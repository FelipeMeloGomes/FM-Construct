import type { Page, Locator } from "@playwright/test"

export class RelatoriosPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/relatorios")
  }

  async getEmptyMessage(): Promise<string | null> {
    const el = this.page.getByText("Nenhum dado cadastrado")
    try {
      await el.waitFor({ timeout: 5_000 })
      return await el.innerText()
    } catch {
      return null
    }
  }

  async selectMonth(mes: string) {
    await this.page.locator("#mes").selectOption(mes)
    await this.page.waitForLoadState("networkidle")
  }

  getExportLink(type: string, format: string): Locator {
    return this.page.locator(`a[href*="type=${type}"][href*="format=${format}"]`)
  }

  async clickExport(type: string, format: string) {
    const link = this.getExportLink(type, format)
    await link.click()
  }

  async getResumoCardValue(label: string): Promise<string> {
    const card = this.page.locator('[data-slot="card"]').filter({
      has: this.page.locator('[data-slot="card-title"]', { hasText: label }),
    })
    return (await card.locator(".text-lg.font-bold").innerText()).trim()
  }

  async getSectionTitle(): Promise<string> {
    return (await this.page.locator("h1.text-2xl").innerText()).trim()
  }

  async isMonthFilterVisible(): Promise<boolean> {
    return this.page.locator("#mes").isVisible()
  }
}
