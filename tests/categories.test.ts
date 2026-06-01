import { describe, it, expect } from "vitest"
import { CATEGORIAS_DESPESA, CATEGORY_BADGE_COLORS } from "@/types"

describe("CATEGORIAS_DESPESA", () => {
  it("contém todas as 5 categorias", () => {
    expect(CATEGORIAS_DESPESA).toHaveLength(5)
  })

  it("cada categoria tem value e label", () => {
    for (const cat of CATEGORIAS_DESPESA) {
      expect(cat.value).toBeTruthy()
      expect(cat.label).toBeTruthy()
    }
  })

  it("categorias esperadas estão presentes", () => {
    const values = CATEGORIAS_DESPESA.map((c) => c.value)
    expect(values).toContain("material")
    expect(values).toContain("alimentacao")
    expect(values).toContain("transporte")
    expect(values).toContain("ferramentas")
    expect(values).toContain("outros")
  })
})

describe("CATEGORY_BADGE_COLORS", () => {
  it("todas as categorias têm cor definida", () => {
    for (const cat of CATEGORIAS_DESPESA) {
      expect(CATEGORY_BADGE_COLORS[cat.value]).toBeTruthy()
    }
  })

  it("cada cor contém classes de bg, text e border", () => {
    for (const cor of Object.values(CATEGORY_BADGE_COLORS)) {
      expect(cor).toContain("bg-")
      expect(cor).toContain("text-")
      expect(cor).toContain("border-")
    }
  })
})
