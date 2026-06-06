import { test, expect } from "../fixtures"
import { TrabalhadoresPage } from "../pages/TrabalhadoresPage"
import { TrabalhadorDetailPage } from "../pages/TrabalhadorDetailPage"
import { closePool } from "../helpers/db"

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA")
}

function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString("en-CA")
}

function sameWeek(date1: string, date2: string): boolean {
  const d1 = new Date(date1 + "T12:00:00")
  const d2 = new Date(date2 + "T12:00:00")
  const getMonday = (d: Date) => {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const m = new Date(d)
    m.setDate(diff)
    m.setHours(0, 0, 0, 0)
    return m
  }
  return getMonday(d1).getTime() === getMonday(d2).getTime()
}

test.describe("Dias Trabalhados", () => {
  let trabalhadoresPage: TrabalhadoresPage
  let detailPage: TrabalhadorDetailPage

  test.afterAll(async () => {
    await closePool()
  })

  test.beforeEach(async ({ page, loggedInPage }) => {
    await loggedInPage
    trabalhadoresPage = new TrabalhadoresPage(page)
    detailPage = new TrabalhadorDetailPage(page)
  })

  test("deve registrar um dia inteiro e exibir como pendente", async ({ page }) => {
    const nome = `João Dias ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await page.getByRole("link", { name: nome, exact: true }).click()
    await page.waitForURL(/\/trabalhadores\//)

    const hoje = todayISO()
    await detailPage.registrarDia(hoje, "inteiro")
    await detailPage.aguardarDiaRegistrado(hoje)

    const status = await detailPage.getStatusText(hoje)
    expect(status).toBe("Pendente")
  })

  test("deve registrar um meio-dia", async ({ page }) => {
    const nome = `Maria Meio ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Servente", "120.00")
    await page.waitForURL("/trabalhadores")

    await page.getByRole("link", { name: nome, exact: true }).click()
    await page.waitForURL(/\/trabalhadores\//)

    const hoje = todayISO()
    await detailPage.registrarDia(hoje, "meio")
    await detailPage.aguardarDiaRegistrado(hoje)

    const status = await detailPage.getStatusText(hoje)
    expect(status).toBe("Pendente")
  })

  test("deve editar um dia de inteiro para meio", async ({ page }) => {
    const nome = `Carlos Edit ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await page.getByRole("link", { name: nome, exact: true }).click()
    await page.waitForURL(/\/trabalhadores\//)

    const hoje = todayISO()
    await detailPage.registrarDia(hoje, "inteiro")
    await detailPage.aguardarDiaRegistrado(hoje)

    await detailPage.editarDia(hoje, "meio")
    await detailPage.aguardarDiaRegistrado(hoje)
  })

  test("deve excluir um dia registrado", async ({ page }) => {
    const nome = `Pedro Del ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await page.getByRole("link", { name: nome, exact: true }).click()
    await page.waitForURL(/\/trabalhadores\//)

    const hoje = todayISO()
    await detailPage.registrarDia(hoje, "inteiro")
    await detailPage.aguardarDiaRegistrado(hoje)

    await detailPage.excluirDia(hoje)
    const dataBR = hoje.split("-").reverse().join("/")
    await expect(page.getByRole("row").filter({ hasText: dataBR })).not.toBeVisible()
  })

  test("deve pagar um dia individual", async ({ page }) => {
    const nome = `Ana Pagamento ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await page.getByRole("link", { name: nome, exact: true }).click()
    await page.waitForURL(/\/trabalhadores\//)

    const hoje = todayISO()
    await detailPage.registrarDia(hoje, "inteiro")
    await detailPage.aguardarDiaRegistrado(hoje)

    await detailPage.pagarDia(hoje)
    await detailPage.aguardarDiaRegistrado(hoje)

    const status = await detailPage.getStatusText(hoje)
    expect(status).toBe("Pago")
  })

  test("deve pagar uma semana completa", async ({ page }) => {
    const nome = `Semana Paga ${Date.now()}`
    await trabalhadoresPage.criarTrabalhador(nome, "Pedreiro", "200.00")
    await page.waitForURL("/trabalhadores")

    await page.getByRole("link", { name: nome, exact: true }).click()
    await page.waitForURL(/\/trabalhadores\//)

    const hoje = todayISO()
    const amanha = tomorrowISO()

    await detailPage.registrarDia(hoje, "inteiro")
    await detailPage.aguardarDiaRegistrado(hoje)

    if (!sameWeek(hoje, amanha)) {
      test.skip()
      return
    }

    await detailPage.registrarDia(amanha, "inteiro")
    await detailPage.aguardarDiaRegistrado(amanha)

    await detailPage.pagarSemana()

    const status1 = await detailPage.getStatusText(hoje)
    const status2 = await detailPage.getStatusText(amanha)
    expect(status1).toBe("Pago")
    expect(status2).toBe("Pago")
  })
})
