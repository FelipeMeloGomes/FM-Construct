# Security Improvements — Backlog

Itens do security review (06/06/2026). Ordenados por prioridade (impacto × esforço).

---

## ✅ Concluídos

| Item | O quê | Arquivos alterados |
|------|-------|--------------------|
| 1 | `allowedOrigins` nas Server Actions | `next.config.ts`, `.env.local.example` |
| 2 | Rate-limit runtime check IP | `src/lib/rate-limit.ts` |
| 3 | Nonce-based CSP (remove `unsafe-inline`) | `src/middleware.ts`, `src/app/layout.tsx` |
| 4 | Validação de redirect mais robusta | `src/app/login/login-form.tsx` |
| 5 | `SESSION_COOKIE_SECURE` env var | `src/actions/auth.ts`, `.env.local.example` |
| 6 | Sessão reduzida para 7 dias | `src/lib/auth.ts`, `src/actions/auth.ts` |
| 7 | `report-uri` → `report-to` no CSP | `src/middleware.ts` |
| 8 | Limpar SW cache no logout | `src/components/layout/header.tsx` |
| 9 | Auditoria de dependências | `package.json` (override postcss)

---

## Como usar esta lista

```bash
# Após implementar um item, marque como concluído:
- [x] Item concluído
- [ ] Pendente
```
