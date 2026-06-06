<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Última sessão — 06/06/2026

### Commits anteriores (branch `beta`)
- `b679a24` test: add logAudit assertions to all server action happy and error paths
- `00b61c1` test: add listarTrabalhadores, obterTrabalhador, listarDespesas, listarDias tests
- `61c1861` test: adiciona auth rejection, not found e erro de banco
- `9907bc4` test: adiciona cobertura para actions faltantes
- `6e01921` refactor: simplifica mock do banco com sqlTagMock

### Uncommitted — já incluso neste commit
- `src/lib/db.ts`: Retry logic no banco (3 tentativas com backoff)
- `src/components/*/dialog*.tsx` + `confirm-dialog.tsx`: Adicionado `router.refresh()` pós-ação
- `.gitignore`: Adicionado `playwright-report/` e `test-results/`

### E2E Tests (Playwright)
- **45 testes** em **10 arquivos** (`e2e/specs/`)
- Page Objects: LoginPage, DashboardPage, TrabalhadoresPage, TrabalhadorDetailPage, DespesasPage, RelatoriosPage
- Fixtures: `loggedInPage` (clean DB + login), helpers: `cleanTestDatabase`, `seedTestDatabase`, `closePool`
- Config: `playwright.config.ts` — Chromium, webServer `pnpm dev`
- `e2e/tsconfig.json` — config próprio com `@types/node`

### Cobertura E2E
- Auth (login, logout, redirect, rate-limit, password toggle)
- Navegação (header links, rotas protegidas)
- Dashboard (empty state, summary cards)
- Trabalhadores (CRUD, search, ativo badge)
- Dias (registrar, editar, excluir, pagar, pagar semana)
- Despesas (CRUD, search, bulk delete)
- Relatórios (empty state, export buttons, month filter, download)
- Error states (404, API sem auth)
- Theme toggle (claro/escuro, persistência)

### Próximos passos sugeridos
- Executar `pnpm test:e2e` para validar os testes E2E (requer banco real em `.env.local`)
- Executar `pnpm build` para build de produção
