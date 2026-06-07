<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Última sessão — 06/06/2026 (Sprint 2)

### Commits anteriores (branch `beta`)
- `b679a24` test: add logAudit assertions to all server action happy and error paths
- `00b61c1` test: add listarTrabalhadores, obterTrabalhador, listarDespesas, listarDias tests
- `61c1861` test: adiciona auth rejection, not found e erro de banco
- `9907bc4` test: adiciona cobertura para actions faltantes
- `6e01921` refactor: simplifica mock do banco com sqlTagMock

### Uncommitted — alterações Sprint 2
- `e2e/specs/pagination.spec.ts`: novo arquivo — paginação de trabalhadores e despesas (>20 registros)
- `e2e/specs/trabalhadores.spec.ts`: testes de ordenação (nome, status) e limpar busca
- `e2e/specs/despesas.spec.ts`: testes de ordenação (data, valor) e limpar busca
- `e2e/specs/rate-limit.spec.ts`: fix — `test.setTimeout(180_000)` para delays progressivos (2ⁱ)
- `e2e/specs/theme.spec.ts`: fix — lógica de asserção invertida (dark class vs aria-label)
- `e2e/specs/dias.spec.ts`: fix — teste paga dia individual usa `toHaveText("Pago")` em vez de `getStatusText`
- `e2e/pages/TrabalhadorDetailPage.ts`: `pagarDia` agora aguarda diálogo fechar (`expect(...not.toBeVisible)`)
- `e2e/pages/TrabalhadoresPage.ts`: métodos `ordenarPor`, `getNomePrimeiraLinha`, `limparBusca`
- `e2e/pages/DespesasPage.ts`: métodos `ordenarPor`, `getDescricaoPrimeiraLinha`, `limparBusca`
- `e2e/helpers/db.ts`: `insertManyTrabalhadores(count)`, `insertManyDespesas(count)`

### E2E Tests (Playwright)
- **57 testes** em **11 arquivos** (`e2e/specs/`)
- Page Objects: LoginPage, DashboardPage, TrabalhadoresPage, TrabalhadorDetailPage, DespesasPage, RelatoriosPage
- Fixtures: `loggedInPage` (clean DB + login), helpers: `cleanTestDatabase`, `seedTestDatabase`, `closePool`
- Config: `playwright.config.ts` — Chromium, webServer `pnpm dev`
- `e2e/tsconfig.json` — config próprio com `@types/node`

### Cobertura E2E
- Auth (login, logout, redirect, rate-limit, password toggle)
- Navegação (header links, rotas protegidas, breadcrumb, redirect autenticado)
- Dashboard (empty state, summary cards, gráficos, últimos pagamentos)
- Trabalhadores (CRUD, search, ativo badge, **sorting nome/status**, **limpar busca**)
- Dias (registrar, editar, excluir, pagar, pagar semana)
- Despesas (CRUD, search, bulk delete, **sorting data/valor**, **limpar busca**)
- **Paginação** (trabalhadores e despesas com >20 registros)
- Relatórios (empty state, export buttons CSV/TXT, month filter, download)
- Error states (404, API sem auth, loading skeleton)
- Theme toggle (claro/escuro, persistência)

### Problemas conhecidos
- Neon DB: timeout de conexão após ~20 queries em execução sequencial (transiente)
- Rate-limit: `test.setTimeout(180_000)` necessário devido a delays progressivos (2ⁱ ms, cap 30s)

### Próximos passos sugeridos
- Executar `pnpm test:e2e` para validar os testes E2E (requer banco real em `.env.local`)
- Executar `pnpm build` para build de produção
