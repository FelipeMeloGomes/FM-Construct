import type { Page, Locator } from "@playwright/test"

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y}`
}

export class TrabalhadorDetailPage {
  constructor(private page: Page) {}

  async goto(nome: string) {
    await this.page.goto("/trabalhadores")
    await this.page.getByRole("link", { name: nome, exact: true }).click()
    await this.page.waitForURL(/\/trabalhadores\//)
  }

  async registrarDia(data: string, tipo: "inteiro" | "meio" = "inteiro") {
    await this.page.getByRole("button", { name: "Registrar Dia" }).click()
    await this.page.locator("#data").fill(data)
    if (tipo === "meio") {
      await this.page.getByRole("radio", { name: "Meio-dia" }).click()
    }
    await this.page.getByRole("button", { name: "Registrar" }).click()
  }

  async editarDia(data: string, novoTipo: "inteiro" | "meio") {
    const dataBR = formatDateBR(data)
    const row = this.getDayRow(dataBR)
    await row.getByRole("button", { name: "Editar dia" }).click()
    if (novoTipo === "meio") {
      await this.page.getByRole("radio", { name: "Meio dia" }).click()
    } else {
      await this.page.getByRole("radio", { name: "Dia inteiro" }).click()
    }
    await this.page.getByRole("button", { name: "Salvar" }).click()
  }

  async excluirDia(data: string) {
    const dataBR = formatDateBR(data)
    const row = this.getDayRow(dataBR)
    await row.getByRole("button", { name: "Excluir dia" }).click()
    await this.page.getByRole("button", { name: "Sim, excluir" }).click()
  }

  async pagarDia(data: string, valor?: string) {
    const dataBR = formatDateBR(data)
    const row = this.getDayRow(dataBR)
    await row.getByRole("button", { name: /^Pagar$/ }).click()
    if (valor) {
      await this.page.locator("#valor_pago").fill(valor)
    }
    await this.page.getByRole("button", { name: "Confirmar Pagamento" }).click()
    await this.page.waitForTimeout(500)
  }

  async pagarSemana() {
    await this.page.getByRole("button", { name: /Pagar Semana/ }).click()
    await this.page.getByRole("button", { name: "Sim, pagar" }).click()
    await this.page.waitForTimeout(1000)
  }

  private getDayRow(dataBR: string): Locator {
    return this.page.getByRole("row").filter({
      hasText: dataBR,
    })
  }

  async getStatusText(data: string): Promise<string> {
    const dataBR = formatDateBR(data)
    const row = this.getDayRow(dataBR)
    return (await row.getByRole("cell").nth(3).innerText()).trim()
  }

  async aguardarDiaRegistrado(data: string) {
    const dataBR = formatDateBR(data)
    await this.page.getByText(dataBR).first().waitFor()
  }
}
