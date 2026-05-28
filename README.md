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

### Trabalhadores (`/trabalhadores`)
- Lista com nome, função, diária, status (ativo/inativo) e total pendente
- Botão inline para registrar dia trabalhado
- Link para editar e excluir trabalhador
- Ordenado por ativos primeiro, depois nome

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
- Lista com descrição, categoria, valor, data
- Totais por categoria no topo
- Editar e excluir com confirmação

### Relatórios (`/relatorios`)
- Filtro por mês (últimos 24 meses)
- Resumo com totais do período
- Exportação para **PDF** e **TXT**:
  - Relatório de trabalhadores
  - Relatório de despesas
  - Relatório geral (tudo em um arquivo)

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
| Fontes | Sora (headings) + DM Sans (body) |
| Deploy | Vercel (free tier) |

---

## Design

**Direção: Industrial Warmth** — estética que remete a um canteiro de obras, aquecida pelo tom âmbar.

- Paleta oklch com variáveis CSS para tema **claro** e **escuro**
- Textura de ruído fractal SVG sobreposta ao fundo
- Gradiente radial sutil no background
- Efeito glassmorphism no header e nav mobile
- Cards com hover lift e borda que acende
- Animações de entrada com fade-in-up escalonado
- Toggle de tema (light/dark) no header, persistido em localStorage
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
```

### Esquema SQL completo em `sql/schema.sql`

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── export/route.ts          # Geração PDF/TXT
│   │   ├── despesas/[id]/route.ts   # GET despesa
│   │   └── trabalhadores/[id]/route.ts # GET trabalhador
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
│   │   └── dashboard-content.tsx    # Cards + resumo mensal
│   ├── layout/
│   │   ├── header.tsx               # Nav desktop + theme toggle
│   │   ├── mobile-nav.tsx           # Bottom nav mobile
│   │   └── page-animation.tsx       # Animação de entrada
│   ├── theme/
│   │   ├── theme-provider.tsx       # Context de tema
│   │   └── theme-toggle.tsx         # Botão light/dark
│   ├── trabalhadores/
│   │   ├── registrar-dia-dialog.tsx
│   │   ├── registrar-pagamento-dialog.tsx
│   │   └── editar-dia-dialog.tsx
│   └── ui/                          # shadcn/ui components
├── lib/
│   ├── db.ts                        # Conexão Neon (lazy)
│   ├── utils.ts                     # formatCurrency, formatDate, cn
│   └── actions/                     # Server Actions
│       ├── trabalhadores.ts
│       ├── dias.ts
│       └── despesas.ts
├── types/
│   └── index.ts
```

---

## Server Actions

Todas as mutações usam Server Actions com `"use server"` e `revalidatePath`:

| Action | Arquivo | Descrição |
|--------|---------|-----------|
| `criarTrabalhador` | `trabalhadores.ts` | Cria trabalhador |
| `atualizarTrabalhador` | `trabalhadores.ts` | Edita dados |
| `deletarTrabalhador` | `trabalhadores.ts` | Remove + dias associados |
| `registrarDia` | `dias.ts` | Registra dia trabalhado |
| `registrarPagamentoDia` | `dias.ts` | Marca dia como pago |
| `atualizarDia` | `dias.ts` | Edita data/tipo/pagamento |
| `pagarSemana` | `dias.ts` | Paga todos pendentes da semana |
| `deletarDia` | `dias.ts` | Remove dia |
| `criarDespesa` | `despesas.ts` | Cria despesa |
| `atualizarDespesa` | `despesas.ts` | Edita despesa |
| `deletarDespesa` | `despesas.ts` | Remove despesa |

---

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

---

## Licença

Uso pessoal — FM-Construct
