import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, toDateInputValue, cn } from "@/lib/utils"

describe("formatCurrency", () => {
  it("formata valor positivo em reais", () => {
    expect(formatCurrency(1500.5)).toBe("R$ 1.500,50")
  })

  it("formata valor zero", () => {
    expect(formatCurrency(0)).toBe("R$ 0,00")
  })

  it("formata valor grande", () => {
    expect(formatCurrency(1234567.89)).toBe("R$ 1.234.567,89")
  })
})

describe("formatDate", () => {
  it("formata Date", () => {
    const d = new Date("2024-01-15T12:00:00Z")
    const result = formatDate(d)
    expect(result).toBe("segunda-feira, 15/01/2024")
  })

  it("formata string ISO", () => {
    const result = formatDate("2024-06-01")
    expect(result).toBe("sábado, 01/06/2024")
  })

  it("retorna '-' para null", () => {
    expect(formatDate(null)).toBe("-")
  })

  it("retorna '-' para undefined", () => {
    expect(formatDate(undefined)).toBe("-")
  })

  it("retorna '-' para data inválida", () => {
    expect(formatDate("not-a-date")).toBe("-")
  })
})

describe("toDateInputValue", () => {
  it("retorna string YYYY-MM-DD para Date", () => {
    const d = new Date("2024-03-10T12:00:00Z")
    expect(toDateInputValue(d)).toBe("2024-03-10")
  })

  it("retorna string YYYY-MM-DD para string ISO", () => {
    expect(toDateInputValue("2024-12-25")).toBe("2024-12-25")
  })

  it("retorna '' para null", () => {
    expect(toDateInputValue(null)).toBe("")
  })

  it("retorna '' para undefined", () => {
    expect(toDateInputValue(undefined)).toBe("")
  })

  it("retorna '' para data inválida", () => {
    expect(toDateInputValue("invalid")).toBe("")
  })
})

describe("cn", () => {
  it("mescla classes do tailwind", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("remove classes conflitantes", () => {
    expect(cn("px-4", "px-2")).toBe("px-2")
  })

  it("filtra valores falsy", () => {
    expect(cn("px-4", false, undefined, null, "py-2")).toBe("px-4 py-2")
  })
})
