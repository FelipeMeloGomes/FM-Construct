const REQUIRED_VARS = ["DATABASE_URL", "AUTH_SECRET", "AUTH_USER", "AUTH_PASS"] as const

let validated = false

export function validateEnv() {
  if (validated) return
  const missing = REQUIRED_VARS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `⚠ Variáveis de ambiente faltando no build: ${missing.join(", ")}. ` +
          "A validação será feita em runtime pelo servidor."
      )
    } else {
      throw new Error(
        `Variáveis de ambiente obrigatórias faltando: ${missing.join(", ")}.\n` +
          "Crie um arquivo .env.local baseado em .env.local.example"
      )
    }
  }
  validated = true
}
