import { z } from "zod"
import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi"

extendZodWithOpenApi(z)

import { loginSchema } from "@/schemas/auth"
import { criarTrabalhadorSchema } from "@/schemas/trabalhadores"
import { criarDespesaSchema } from "@/schemas/despesas"
import { registrarDiaSchema, registrarPagamentoSchema, atualizarDiaSchema } from "@/schemas/dias"
import type { Trabalhador, DiaTrabalhado, Despesa } from "@/types"

const actionResultSchema = z.object({
  success: z.boolean(),
  redirectTo: z.string().optional(),
  error: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
})

const trabalhadorSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  funcao: z.enum(["pedreiro", "servente"]),
  valor_diaria: z.number(),
  ativo: z.boolean(),
  created_at: z.string(),
}) satisfies z.ZodType<Trabalhador>

const diaTrabalhadoSchema = z.object({
  id: z.string().uuid(),
  trabalhador_id: z.string().uuid(),
  data: z.string(),
  tipo: z.enum(["inteiro", "meio"]),
  valor_dia: z.number(),
  pago: z.boolean(),
  valor_pago: z.number().nullable(),
  data_pagamento: z.string().nullable(),
  observacao: z.string().nullable(),
  created_at: z.string(),
}) satisfies z.ZodType<DiaTrabalhado>

const despesaSchema = z.object({
  id: z.string().uuid(),
  descricao: z.string(),
  categoria: z.enum(["material", "alimentacao", "transporte", "ferramentas", "outros"]),
  valor: z.number(),
  data: z.string(),
  pago_para: z.string().nullable(),
  observacao: z.string().nullable(),
  created_at: z.string(),
}) satisfies z.ZodType<Despesa>

const registry = new OpenAPIRegistry()

registry.register("ActionResult", actionResultSchema)
registry.register("Trabalhador", trabalhadorSchema)
registry.register("DiaTrabalhado", diaTrabalhadoSchema)
registry.register("Despesa", despesaSchema)

const actionResultResponse = {
  200: {
    description: "Resultado da operação",
    content: { "application/json": { schema: actionResultSchema } },
  },
}

registry.registerPath({
  method: "post",
  path: "/actions/auth/login",
  summary: "Login",
  description: "Server Action. Autentica o usuário com HMAC + rate limit.",
  tags: ["Auth"],
  request: {
    body: {
      description: "Credenciais (via FormData)",
      content: { "application/json": { schema: loginSchema } },
      required: true,
    },
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "post",
  path: "/actions/auth/logout",
  summary: "Logout",
  description: "Server Action. Limpa os cookies de autenticação.",
  tags: ["Auth"],
  responses: actionResultResponse,
})

// Trabalhadores
registry.registerPath({
  method: "post",
  path: "/actions/trabalhadores/criar",
  summary: "Criar trabalhador",
  description: "Server Action. Cria um novo trabalhador.",
  tags: ["Trabalhadores"],
  request: {
    body: {
      description: "Dados do trabalhador (via FormData)",
      content: { "application/json": { schema: criarTrabalhadorSchema } },
      required: true,
    },
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "patch",
  path: "/actions/trabalhadores/{id}",
  summary: "Atualizar trabalhador",
  description: "Server Action. Atualiza os dados de um trabalhador.",
  tags: ["Trabalhadores"],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      description: "Dados do trabalhador (via FormData)",
      content: { "application/json": { schema: criarTrabalhadorSchema } },
      required: true,
    },
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "patch",
  path: "/actions/trabalhadores/{id}/toggle-ativo",
  summary: "Alternar ativo/inativo",
  description: "Server Action. Ativa ou desativa um trabalhador.",
  tags: ["Trabalhadores"],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "delete",
  path: "/actions/trabalhadores/{id}",
  summary: "Deletar trabalhador",
  description: "Server Action. Remove um trabalhador.",
  tags: ["Trabalhadores"],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "post",
  path: "/actions/trabalhadores/batch-delete",
  summary: "Deletar trabalhadores em lote",
  description: "Server Action. Remove múltiplos trabalhadores.",
  tags: ["Trabalhadores"],
  responses: actionResultResponse,
})

registry.registerPath({
  method: "get",
  path: "/actions/trabalhadores",
  summary: "Listar trabalhadores",
  description: "Server Action. Retorna todos os trabalhadores ordenados por ativo/nome.",
  tags: ["Trabalhadores"],
  responses: {
    200: {
      description: "Lista de trabalhadores",
      content: { "application/json": { schema: z.array(trabalhadorSchema) } },
    },
  },
})

registry.registerPath({
  method: "get",
  path: "/actions/trabalhadores/{id}",
  summary: "Obter trabalhador",
  description: "Server Action. Retorna um trabalhador pelo ID.",
  tags: ["Trabalhadores"],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Trabalhador encontrado",
      content: { "application/json": { schema: trabalhadorSchema.nullable() } },
    },
  },
})

// Dias
registry.registerPath({
  method: "post",
  path: "/actions/dias/registrar",
  summary: "Registrar dia trabalhado",
  description: "Server Action. Registra um dia de trabalho para um trabalhador.",
  tags: ["Dias"],
  request: {
    body: {
      description: "Dados do dia (via FormData)",
      content: { "application/json": { schema: registrarDiaSchema } },
      required: true,
    },
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "post",
  path: "/actions/dias/registrar-pagamento",
  summary: "Registrar pagamento de dia",
  description: "Server Action. Marca um dia como pago.",
  tags: ["Dias"],
  request: {
    body: {
      description: "Dados do pagamento (via FormData)",
      content: { "application/json": { schema: registrarPagamentoSchema } },
      required: true,
    },
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "patch",
  path: "/actions/dias/{id}",
  summary: "Atualizar dia trabalhado",
  description: "Server Action. Atualiza os dados de um dia trabalhado.",
  tags: ["Dias"],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      description: "Dados atualizados do dia (via FormData)",
      content: { "application/json": { schema: atualizarDiaSchema } },
      required: true,
    },
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "post",
  path: "/actions/dias/pagar-semana",
  summary: "Pagar semana",
  description: "Server Action. Marca múltiplos dias como pagos de uma vez.",
  tags: ["Dias"],
  responses: actionResultResponse,
})

registry.registerPath({
  method: "delete",
  path: "/actions/dias/{id}",
  summary: "Deletar dia trabalhado",
  description: "Server Action. Remove um dia trabalhado.",
  tags: ["Dias"],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "get",
  path: "/actions/trabalhadores/{trabalhadorId}/dias",
  summary: "Listar dias de um trabalhador",
  description: "Server Action. Retorna todos os dias de um trabalhador ordenados por data descendente.",
  tags: ["Dias"],
  request: {
    params: z.object({ trabalhadorId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Lista de dias trabalhados",
      content: { "application/json": { schema: z.array(diaTrabalhadoSchema) } },
    },
  },
})

// Despesas
registry.registerPath({
  method: "post",
  path: "/actions/despesas/criar",
  summary: "Criar despesa",
  description: "Server Action. Cria uma nova despesa.",
  tags: ["Despesas"],
  request: {
    body: {
      description: "Dados da despesa (via FormData)",
      content: { "application/json": { schema: criarDespesaSchema } },
      required: true,
    },
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "delete",
  path: "/actions/despesas/{id}",
  summary: "Deletar despesa",
  description: "Server Action. Remove uma despesa.",
  tags: ["Despesas"],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "post",
  path: "/actions/despesas/batch-delete",
  summary: "Deletar despesas em lote",
  description: "Server Action. Remove múltiplas despesas.",
  tags: ["Despesas"],
  responses: actionResultResponse,
})

registry.registerPath({
  method: "patch",
  path: "/actions/despesas/{id}",
  summary: "Atualizar despesa",
  description: "Server Action. Atualiza os dados de uma despesa.",
  tags: ["Despesas"],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      description: "Dados atualizados da despesa (via FormData)",
      content: { "application/json": { schema: criarDespesaSchema } },
      required: true,
    },
  },
  responses: actionResultResponse,
})

registry.registerPath({
  method: "get",
  path: "/actions/despesas",
  summary: "Listar despesas",
  description: "Server Action. Retorna todas as despesas ordenadas por data descendente.",
  tags: ["Despesas"],
  responses: {
    200: {
      description: "Lista de despesas",
      content: { "application/json": { schema: z.array(despesaSchema) } },
    },
  },
})

// Route Handlers (HTTP reais)
registry.registerPath({
  method: "get",
  path: "/api/export",
  summary: "Exportar relatório",
  description:
    "Rota de API real. Faz download de relatório em TXT, CSV ou PDF. Requer cookie de autenticação.",
  tags: ["Export"],
  request: {
    query: z.object({
      type: z.enum(["geral", "trabalhadores", "despesas"]).optional().default("geral"),
      format: z.enum(["txt", "csv", "pdf"]).optional().default("txt"),
      mes: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    }),
  },
  responses: {
    200: { description: "Arquivo exportado (Content-Disposition: attachment)" },
    401: {
      description: "Não autorizado",
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
    },
  },
})

registry.registerPath({
  method: "post",
  path: "/api/csp-report",
  summary: "Receber CSP Report",
  description: "Rota de API real. Coleta relatórios de violação de CSP. Sem autenticação.",
  tags: ["CSP"],
  responses: {
    204: { description: "Report recebido (sem conteúdo)" },
  },
})

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "FM-Construct API",
      version: "1.0.0",
      description:
        "Documentação da API do FM-Construct.\n\n**Nota:** A maioria dos endpoints são Server Actions do Next.js — não são rotas HTTP reais, mas ações executadas no servidor via FormData. Apenas `/api/export` e `/api/csp-report` são rotas de API reais.\n\nTodas as Server Actions requerem autenticação via cookie `fm_auth` (exceto `loginAction`).",
    },
    servers: [{ url: "/", description: "Servidor local" }],
  })
}
