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
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 + CSS variáveis oklch |
| Componentes | shadcn/ui (base-nova style, @base-ui/react) |
| Banco | Neon Postgres (serverless) |
| ORM | @neondatabase/serverless (SQL tagged template) |
| Validação | Zod |
| Formulários | react-hook-form + @hookform/resolvers |
| PDF | jspdf + jspdf-autotable |
| Datas | date-fns |
| Ícones | lucide-react |
| Notificações | sonner |
| Gráficos | chart.js + react-chartjs-2 |
| Export PNG | html-to-image |
| Fontes | Sora (headings) + DM Sans (body) |
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
│   ├── api/
│   │   └── export/route.ts          # Geração PDF/TXT/CSV
│   ├── despesas/
│   │   ├── page.tsx                 # Lista de despesas
│   │   ├── nova/page.tsx            # Nova despesa
│   │   └── [id]/editar/page.tsx     # Editar despesa
│   ├── relatorios/
│   │   ├── page.tsx                 # Relatórios + filtro mês
│   │   └── filtro-mes.tsx           # Select de meses
│   ├── trabalhadores/
│   │   ├── page.tsx                 # Lista de trabalhadores
│   │   ├── novo/page.tsx            # Novo trabalhador
│   │   ├── [id]/page.tsx            # Detalhe do trabalhador
│   │   └── [id]/editar/page.tsx     # Editar trabalhador
│   ├── page.tsx                     # Dashboard
│   ├── layout.tsx                   # Layout root
│   └── globals.css                  # Estilos globais + tema
├── components/
│   ├── dashboard/
│   │   ├── charts.tsx               # Gráficos chart.js
│   │   ├── dashboard-content.tsx    # Cards + resumo mensal
│   │   └── monthly-export-card.tsx  # Export PNG do resumo
│   ├── despesas/
│   │   └── despesas-table.tsx       # Tabela client-side com busca/ordenação
│   ├── layout/
│   │   ├── header.tsx               # Nav desktop + theme toggle
│   │   ├── mobile-nav.tsx           # Bottom nav mobile
│   │   └── transition-link.tsx      # Link com view transition
│   ├── theme/
│   │   ├── theme-provider.tsx       # Context de tema
│   │   └── theme-toggle.tsx         # Botão light/dark
│   ├── trabalhadores/
│   │   ├── registrar-dia-dialog.tsx
│   │   ├── registrar-pagamento-dialog.tsx
│   │   ├── editar-dia-dialog.tsx
│   │   └── trabalhadores-table.tsx  # Tabela client-side com busca/ordenação
│   └── ui/
│       ├── bulk-delete-bar.tsx      # Barra de deleção em massa
│       ├── confirm-dialog.tsx       # Diálogo de confirmação com toast
│       └── pagination-bar.tsx       # Paginação compartilhada
├── lib/
│   ├── auth.ts                     # HMAC-SHA256 auth + requireAuth
│   ├── db.ts                       # Conexão Neon (lazy)
│   ├── rate-limit.ts               # Rate limit (10 tentativas → bloqueio 15min)
│   ├── utils.ts                    # formatCurrency, formatDate, cn
│   ├── audit.ts                    # Audit log
│   ├── export/                     # Geradores de exportação
│   └── actions/                    # Server Actions
│       ├── auth.ts                 # loginAction + logoutAction
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
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar DATABASE_URL com string de conexão Neon

# Rodar migrations no Neon SQL Editor
# Abrir sql/schema.sql e executar

# Iniciar dev server
npm run dev
```

### Build

```bash
npm run build    # Verifica TypeScript + produz build otimizado
npm run dev      # Servidor de desenvolvimento
```

---

## Deploy

O projeto está configurado para deploy na **Vercel** (plano gratuito):

- Conectado via GitHub: pushes na `main` geram deploy automático
- Banco: Neon Postgres (free tier)
- Autenticação: Password Protection nativa da Vercel (opcional)

### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do Neon Postgres |
| `AUTH_SECRET` | Chave secreta para assinatura HMAC dos cookies |
| `AUTH_PASSWORD` | Senha de acesso ao sistema |

---

## Licença

Uso pessoal — FM-Construct
