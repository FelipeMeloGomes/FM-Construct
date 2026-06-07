import type { Page, Locator } from "@playwright/test"

export class TrabalhadoresPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/trabalhadores")
  }

  async gotoNovo() {
    await this.page.goto("/trabalhadores/novo")
  }

  async gotoEditar(id: string) {
    await this.page.goto(`/trabalhadores/${id}/editar`)
  }

  async preencherFormulario(nome: string, funcao: string, valorDiaria: string) {
    await this.page.getByLabel("Nome completo").fill(nome)
    await this.page.locator('[data-slot="select-trigger"]').first().click()
    await this.page.getByRole("option", { name: funcao }).click()
    await this.page.getByLabel("Valor da diária (R$)").fill(valorDiaria)
  }

  async submeterFormulario() {
    await this.page.getByRole("button", { name: "Cadastrar" }).click()
  }

  async submeterEdicao() {
    await this.page.getByRole("button", { name: "Salvar" }).click()
  }

  async criarTrabalhador(nome: string, funcao: string, valorDiaria: string) {
    await this.gotoNovo()
    await this.preencherFormulario(nome, funcao, valorDiaria)
    await this.submeterFormulario()
  }

  getRowByName(nome: string): Locator {
    return this.page.getByRole("row").filter({ hasText: nome })
  }

  async clicarEditar(nome: string) {
    const row = this.getRowByName(nome)
    await row.getByRole("button", { name: "Editar trabalhador" }).click()
  }

  async clicarExcluir(nome: string) {
    const row = this.getRowByName(nome)
    await row.getByRole("button", { name: "Excluir trabalhador" }).click()
    await this.page.getByRole("button", { name: "Sim, excluir" }).click()
  }

  async confirmarExclusao() {
    await this.page.getByRole("button", { name: "Sim, excluir" }).click()
  }

  getMensagemVazia() {
    return this.page.getByText("Nenhum trabalhador cadastrado")
  }

  async buscar(termo: string) {
    await this.page.getByPlaceholder("Buscar por nome ou função...").fill(termo)
  }

  async limparBusca() {
    await this.page.getByRole("button", { name: "Limpar busca" }).click()
  }

  async ordenarPor(coluna: string) {
    await this.page.locator("th.cursor-pointer").filter({ hasText: coluna }).click()
  }

  async getNomePrimeiraLinha(): Promise<string> {
    return await this.page.locator("tbody tr").first().locator("td").nth(1).innerText()
  }
}
