import type { Page, Locator } from "@playwright/test"

export class DespesasPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/despesas")
  }

  async gotoNova() {
    await this.page.goto("/despesas/nova")
  }

  async gotoEditar(id: string) {
    await this.page.goto(`/despesas/${id}/editar`)
  }

  async preencherFormulario(
    descricao: string,
    categoria: string,
    valor: string,
    data?: string,
  ) {
    await this.page.getByLabel("Descrição").fill(descricao)
    await this.page.locator('[data-slot="select-trigger"]').first().click()
    await this.page.getByRole("option", { name: categoria }).click()
    await this.page.getByLabel("Valor (R$)").fill(valor)
    if (data) {
      await this.page.getByLabel("Data").fill(data)
    }
  }

  async submeterFormulario() {
    await this.page.getByRole("button", { name: "Registrar Despesa" }).click()
  }

  async submeterEdicao() {
    await this.page.getByRole("button", { name: "Salvar" }).click()
  }

  async criarDespesa(descricao: string, categoria: string, valor: string, data?: string) {
    await this.gotoNova()
    await this.preencherFormulario(descricao, categoria, valor, data)
    await this.submeterFormulario()
  }

  getRowByDescricao(descricao: string): Locator {
    return this.page.getByRole("row").filter({ hasText: descricao })
  }

  async clicarEditar(descricao: string) {
    const row = this.getRowByDescricao(descricao)
    await row.getByRole("button", { name: "Editar despesa" }).click()
  }

  async clicarExcluir(descricao: string) {
    const row = this.getRowByDescricao(descricao)
    await row.getByRole("button", { name: "Excluir despesa" }).click()
    await this.page.getByRole("button", { name: "Sim, excluir" }).click()
  }

  async selecionarDespesa(descricao: string) {
    const row = this.getRowByDescricao(descricao)
    await row.getByRole("checkbox").click()
  }

  async clicarExcluirSelecionados() {
    await this.page.getByRole("button", { name: /Excluir selecionados/ }).click()
  }

  async getMensagemVazia() {
    return this.page.getByText("Nenhuma despesa registrada")
  }

  async buscar(termo: string) {
    await this.page.getByPlaceholder("Buscar por descrição ou favorecido...").fill(termo)
  }
}
