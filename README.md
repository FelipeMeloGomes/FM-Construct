# FM-Construct

Sistema de gerenciamento de obra para pequenas construções — controle de pedreiros, serventes, pagamentos e despesas.

**Live:** [https://fm-construct.vercel.app](https://fm-construct.vercel.app)

---

## Funcionalidades

### Dashboard (`/`)
- Cards resumo: trabalhadores ativos, total pago, total pendente, total despesas
- Custo total da obra (pago + despesas)
- Resumo do mês corrente (pago, pendente, despesas)
- Últimos 5 pagamentos registrados
- **Gráficos**: Barra (valores por mês) + Doughnut (distribuição de custos) com chart.js
- **Exportar resumo como PNG**: card de exportação com `html-to-image`

### Trabalhadores (`/trabalhadores`)
- Lista com nome, função, diária, status (ativo/inativo) e total pendente
- Botão inline para registrar dia trabalhado
- Link para editar e excluir trabalhador
- Ordenação por qualquer coluna (clique no cabeçalho)
- Busca por nome/função
- Paginação (20 por página)
- Seleção múltipla com deleção em massa

### Detalhe do Trabalhador (`/trabalhadores/[id]`)
- Cards: total devido, total pago, pendente
- Dias agrupados por mês, com subtotais
- Dentro de cada mês, dias agrupados por semana (segunda–domingo)
- Botão "Pagar semana" para quitar todos os pendentes da semana
- Por dia: registrar pagamento, editar, excluir
- Paginação: mostra últimos 3 meses por padrão, "Mostrar todos" para ver completo
- Badge de status: **Pago** (verde), **Parcial** (âmbar), **Pendente** (vermelho)
- Log de **dia inteiro** (diária cheia) ou **meio-dia** (metade da diária)

### Despesas (`/despesas`)
- Lista com descrição, categoria, valor, data, pago para
- Totais por categoria no topo
- Ordenação por qualquer coluna
- Busca por descrição/favorecido/categoria
- Paginação (20 por página)
- Seleção múltipla com deleção em massa
- Editar e excluir com confirmação

### Relatórios (`/relatorios`)
- Filtro por mês (últimos 24 meses)
- Resumo com totais do período
- Exportação para **PDF**, **TXT** e **CSV**:
  - Relatório de trabalhadores
  - Relatório de despesas
  - Relatório geral (tudo em um arquivo)
- **Empty state**: mensagem quando não há dados

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript (strict, sem `any`) |
| Estilo | Tailwind CSS v4 + CSS variáveis oklch |
| Componentes | shadcn/ui (base-nova style, @base-ui/react) |
| Banco | Neon Postgres (serverless) |
| ORM | @neondatabase/serverless (SQL tagged template) |
| Validação | Zod |
| Ícones | lucide-react (com optimizePackageImports) |
| Gráficos | chart.js + react-chartjs-2 (dynamic import) |
| PDF | jspdf + jspdf-autotable |
| Export PNG | html-to-image |
| Notificações | sonner |
| Fontes | Sora (headings) + DM Sans (body) |
| Documentação API | OpenAPI 3.0 + Swagger UI (gerado dos schemas Zod) |
| Testes (unit) | Vitest + Testing Library (115 testes) |
| Testes (E2E) | Playwright (57 testes — 11 specs) |
| Lint | ESLint + eslint-plugin-vitest |
| Package Manager | pnpm 10 |
| CI/CD | GitHub Actions (lint → test → build → deploy) |
| Deploy | Vercel (free tier) |

---

## Design

**Direção: Industrial Warmth** — estética que remete a um canteiro de obras, aquecida pelo tom âmbar.

- Paleta oklch com variáveis CSS para tema **claro** e **escuro**
- Tema claro refinado "Warm Workshop" com radial glow e card-hover
- Textura de ruído fractal SVG sobreposta ao fundo
- Gradiente radial sutil no background
- Efeito glassmorphism no header e nav mobile
- Cards com hover lift e borda que acende
- Animações de entrada com fade-in-up escalonado (classes CSS `delay-1` a `delay-6`)
- Toggle de tema (light/dark) no header, persistido em localStorage, sem flash de tema incorreto
- Scrollbar customizada
- Botões com efeito glow no hover

---

## Banco de Dados

### Tabelas

```sql
trabalhadores
  id            UUID PRIMARY KEY
  nome          TEXT NOT NULL
  funcao        TEXT NOT NULL          -- pedreiro, servente
  valor_diaria  DECIMAL(10,2) NOT NULL
  ativo         BOOLEAN DEFAULT true
  created_at    TIMESTAMPTZ DEFAULT now()

dias_trabalhados
  id              UUID PRIMARY KEY
  trabalhador_id  UUID REFERENCES trabalhadores(id)
  data            DATE NOT NULL
  tipo            TEXT NOT NULL          -- 'inteiro' | 'meio'
  valor_dia       DECIMAL(10,2) NOT NULL
  pago            BOOLEAN DEFAULT false
  valor_pago      DECIMAL(10,2)
  data_pagamento  DATE
  observacao      TEXT
  created_at      TIMESTAMPTZ DEFAULT now()

despesas
  id          UUID PRIMARY KEY
  descricao   TEXT NOT NULL
  valor       DECIMAL(10,2) NOT NULL
  categoria   TEXT NOT NULL
  data        DATE NOT NULL
  pago_para   TEXT                    -- opcional: nome do trabalhador
  created_at  TIMESTAMPTZ DEFAULT now()

rate_limits
  ip            VARCHAR(45) PRIMARY KEY
  attempt_count INTEGER DEFAULT 1
  blocked_until TIMESTAMPTZ
  updated_at    TIMESTAMPTZ DEFAULT now()
```

### Esquema SQL completo em `sql/schema.sql`

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── (app)/                      # Route group: layout com Header
│   │   ├── page.tsx                # Dashboard
│   │   ├── layout.tsx              # Header + MobileNav + Toaster
│   │   ├── login/
│   │   ├── trabalhadores/
│   │   ├── despesas/
│   │   └── relatorios/
│   ├── (docs)/                     # Route group: layout sem Header
│   │   ├── layout.tsx              # Minimal (apenas children)
│   │   └── docs/
│   │       └── page.tsx            # Swagger UI
│   ├── api/
│   │   ├── docs/route.ts           # GET → OpenAPI spec JSON
│   │   ├── export/route.ts         # GET → PDF/TXT/CSV
│   │   └── csp-report/route.ts     # POST → CSP violation report
│   ├── layout.tsx                  # Root layout (fonts, ThemeProvider)
│   └── globals.css                 # Estilos globais + tema
├── components/                     # (inalterado)
├── schemas/                        # Schemas Zod centralizados
│   ├── index.ts
│   ├── _shared.ts                 # uuidSchema
│   ├── auth.ts
│   ├── trabalhadores.ts
│   ├── dias.ts
│   └── despesas.ts
├── lib/
│   ├── auth.ts                     # HMAC-SHA256 auth + requireAuth
│   ├── db.ts                       # Conexão Neon (lazy)
│   ├── rate-limit.ts               # Rate limit (10 tentativas → bloqueio 15min)
│   ├── utils.ts                    # formatCurrency, formatDate, cn
│   ├── audit.ts                    # Audit log
│   ├── openapi.ts                  # Gerador da spec OpenAPI
│   ├── export/                     # Geradores de exportação
│   └── actions/                    # Server Actions (importam schemas de @/schemas/)
│       ├── shared.ts               # ActionResult type + parseError
│       ├── trabalhadores.ts
│       ├── dias.ts
│       └── despesas.ts
├── types/
│   └── index.ts
```

---

## Autenticação

- **Login**: senha única verificada com HMAC-SHA256, cookie assinado com expiração de 30 dias
- **Rate limit**: 10 tentativas falhas → bloqueio de 15 minutos com backoff exponencial (1s–30s)
  - Tabela `rate_limits` no Postgres por IP
  - Reset automático após 30min do fim do bloqueio
- CSRF protegido nativamente pelo Next.js Server Actions

## Server Actions

Todas as mutações usam Server Actions com `"use server"` e `revalidatePath`:

| Action | Arquivo | Descrição |
|--------|---------|-----------|
| `loginAction` | `auth.ts` | Login com HMAC + rate limit |
| `logoutAction` | `auth.ts` | Logout |
| `criarTrabalhador` | `trabalhadores.ts` | Cria trabalhador |
| `atualizarTrabalhador` | `trabalhadores.ts` | Edita dados |
| `deletarTrabalhador` | `trabalhadores.ts` | Remove + dias associados |
| `deletarTrabalhadores` | `trabalhadores.ts` | Deleção em massa |
| `registrarDia` | `dias.ts` | Registra dia trabalhado |
| `registrarPagamentoDia` | `dias.ts` | Marca dia como pago |
| `atualizarDia` | `dias.ts` | Edita data/tipo/pagamento |
| `pagarSemana` | `dias.ts` | Paga todos pendentes da semana |
| `deletarDia` | `dias.ts` | Remove dia |
| `criarDespesa` | `despesas.ts` | Cria despesa |
| `atualizarDespesa` | `despesas.ts` | Edita despesa |
| `deletarDespesa` | `despesas.ts` | Remove despesa |
| `deletarDespesas` | `despesas.ts` | Deleção em massa |

---

## Documentação da API

A API é documentada automaticamente via **OpenAPI 3.0** + **Swagger UI**:

### Acesso

- **Swagger UI**: `http://localhost:3000/docs`
- **Spec JSON**: `http://localhost:3000/api/docs`

A spec é gerada dinamicamente a partir dos **schemas Zod** em `src/schemas/` e inclui:

- **Server Actions** (16 operações — Auth, Trabalhadores, Dias, Despesas)
- **Route Handlers** (`GET /api/export`, `POST /api/csp-report`)

### Geração

| Arquivo | Função |
|---------|--------|
| `src/schemas/` | Schemas Zod extraídos das actions |
| `src/lib/openapi.ts` | `generateOpenApiSpec()` usando `@asteasolutions/zod-to-openapi` |
| `src/app/api/docs/route.ts` | Rota que serve o JSON da spec |
| `src/app/(docs)/docs/page.tsx` | Swagger UI carregado via jsDelivr |

```bash
# A spec reflete automaticamente os schemas — nenhuma manutenção manual
```

---
## UX & Interação

- **Confirmação**: todas as ações destrutivas (excluir trabalhador, despesa, dia) passam por `ConfirmDialog` com toast de feedback via sonner
- **Paginação**: componente `PaginationBar` reutilizável com suporte a cliente (`onPageChange`) e servidor (`baseHref`) com elipse
- **Deleção em massa**: checkboxes nas tabelas + `BulkDeleteBar` vermelha com contagem
- **View Transitions**: navegação entre páginas com animação suave via React `<ViewTransition>`
- **Nav ativa**: destaca a rota atual no header e mobile nav, incluindo sub-rotas
- **Responsivo**: tabelas escondem colunas não essenciais em mobile; botões grandes para toque

## Pagamento Parcial

O sistema suporta pagamento parcial de dias trabalhados:

- `totalPendente = totalDevido - totalPago` (soma de todos os dias)
- Badge por dia:
  - `valor_pago >= valor_dia` → **Pago**
  - `valor_pago > 0` → **Parcial**
  - `valor_pago = 0` → **Pendente**
- No dashboard e relatórios, `totalPendente` reflete corretamente os parciais

---

## Convenções de Semana

- Semanas vão de **segunda a domingo** (padrão brasileiro)
- Dias ordenados ASC (mais antigo primeiro)
- Meses ordenados ASC
- Últimos 3 meses por padrão no detalhe do trabalhador
- `getWeekStart` usa getters UTC para evitar problemas de fuso horário com datas do Postgres

---

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar DATABASE_URL com string de conexão Neon

# Rodar migrations no Neon SQL Editor
# Abrir sql/schema.sql e executar

# Iniciar dev server
pnpm dev
```

### Banco de Desenvolvimento

Crie uma **Child Branch** no Neon a partir da Main — assim dev e produção usam bancos isolados:

1. Acesse https://console.neon.tech → seu projeto → **Branches** → **Create branch**
2. Copie a connection string da nova branch
3. Atualize `DATABASE_URL` no `.env.local`

### Build & Testes

```bash
pnpm lint        # ESLint
pnpm test        # Vitest (115 testes)
pnpm test:e2e    # Playwright (57 testes, requer banco real)
pnpm build       # TypeScript + build otimizado
pnpm dev         # Servidor de desenvolvimento (Turbopack)
```

---

## CI/CD

O workflow `CI/CD` (`.github/workflows/ci.yml`) roda em todo push para `main` e `beta`:

```
lint ─┐
       ├→ build → deploy
test ──┘
```

- **lint** e **test** rodam em paralelo
- **build** só executa se ambos passarem
- **deploy** só executa se o build passar
  - `main` → produção (`vercel deploy --prod`)
  - `beta` → preview

O auto-deploy do Vercel via git está desabilitado (`vercel.json` → `deploymentEnabled: false`). Todo deploy é controlado pelo workflow.

## Deploy

Projeto hospedado na **Vercel** (plano gratuito):

- Banco: Neon Postgres (free tier)
- Deploy via GitHub Actions (não automático do Vercel)
- Ambiente de produção isolado do dev (Neon branches)

### Variáveis de Ambiente (GitHub Secrets)

| Secret | Descrição |
|--------|-----------|
| `DATABASE_URL` | Connection string do Neon Postgres (produção) |
| `AUTH_USER` | Usuário de login |
| `AUTH_PASS` | Senha de login |
| `AUTH_SECRET` | Chave secreta HMAC dos cookies |
| `VERCEL_TOKEN` | Token de acesso Vercel |
| `VERCEL_ORG_ID` | ID da organização Vercel |
| `VERCEL_PROJECT_ID` | ID do projeto Vercel |

---

## Licença

Uso pessoal — FM-Construct
