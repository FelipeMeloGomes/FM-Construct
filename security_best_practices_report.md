# Security Review Report — FM-Construct

**Date:** 2026-06-06  
**Scope:** Full-stack Next.js 16 app with Neon Postgres, self-hosted or Vercel-deployed  
**Review type:** Active audit (per `security-best-practices` skill + Next.js/React security specs)

---

## Executive Summary

FM-Construct is a single-user construction management tool with a **solid security baseline**. The codebase:

- ✅ Uses **parameterized queries** (postgres.js tagged templates) — no SQL injection
- ✅ Stores auth tokens in **httpOnly, SameSite cookies** — not localStorage
- ✅ Has **no `dangerouslySetInnerHTML`**, `eval`, or DOM XSS sinks
- ✅ Sets **CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy**
- ✅ Cleans the DB connection per request (serverless pattern via `@neondatabase/serverless`)
- ✅ Properly **gitignores `.env*` files** — no committed secrets in history
- ✅ Enforces **server-side auth** on all state-changing actions (`requireAuth()`)
- ✅ Has **rate limiting** on login (Postgres-backed, exponential backoff)
- ✅ No `NEXT_PUBLIC_` env vars exposing secrets to the browser

**3 Medium-severity findings** and **3 Low-severity observations** were identified. No Critical or High issues were found. The project follows security best practices for its scope (single-user internal tool with simple auth).

---

## Findings

### FM‑SEC‑001 — CSP uses `'unsafe-inline'` for scripts

| Field | Value |
|-------|-------|
| **Rule** | NEXT-CSP-001 |
| **Severity** | Medium |
| **Location** | `src/middleware.ts:10` |
| **Evidence** | `script-src 'self' 'unsafe-inline' https://vercel.live${isDev ? " 'unsafe-eval'" : ""}` |
| **Impact** | Any XSS vulnerability can execute arbitrary scripts inline; CSP cannot block it. In dev mode, `'unsafe-eval'` is also added. |
| **Fix** | Use **nonce-based CSP**: generate a unique nonce per request in middleware, pass it to Server Components/Next.js scripts. Next.js supports nonce-based CSP via `next/script`. |
| **Mitigation** | No `dangerouslySetInnerHTML` or DOM injection sinks exist, and React's default escaping reduces XSS risk. The `'unsafe-inline'` is largely unavoidable with current Next.js (hydration inline scripts). This is an accepted trade-off for most Next.js apps. |

---

### FM‑SEC‑002 — Server Actions allow all origins (missing `allowedOrigins`)

| Field | Value |
|-------|-------|
| **Rule** | NEXT-CSRF-001 |
| **Severity** | Medium |
| **Location** | `next.config.ts` (no `allowedOrigins` key under `serverActions`) |
| **Evidence** | Only `bodySizeLimit: "1mb"` is set; no `allowedOrigins` means all origins can invoke Server Actions |
| **Impact** | Cross-site request forgery (CSRF) on Server Actions. However, the app uses `sameSite: "lax"` cookies, which blocks most cross-site POST requests, and all actions require auth. |
| **Fix** | Add `allowedOrigins: [process.env.APP_ORIGIN].filter(Boolean)` to `next.config.ts` serverActions config. |
| **Mitigation** | Cookie `SameSite=Lax` and server-side auth (`requireAuth()`) on every action provide strong defense-in-depth. |

---

### FM‑SEC‑003 — Rate limiting depends on client `x-forwarded-for` IP

| Field | Value |
|-------|-------|
| **Rule** | NEXT-DOS-001 |
| **Severity** | Medium |
| **Location** | `src/lib/rate-limit.ts` (entire file, especially lines 10–12) |
| **Evidence** | The `checkRateLimit` function receives `ip: string` from the caller. In `src/actions/auth.ts`, the IP is extracted from `request.headers.get("x-forwarded-for")`. A misconfigured reverse proxy (or none at all) would allow IP spoofing. |
| **Impact** | An attacker behind a proxy could spoof their IP and bypass rate limits, enabling brute-force login attempts. On Vercel this is managed. |
| **Fix** | Document in a comment that the app REQUIRES a reverse proxy to sanitize `x-forwarded-for`. Alternatively, use `request.headers.get("cf-connecting-ip")` on Cloudflare, or `request.ip` where available. |
| **Mitigation** | Single-user app; brute-force risk is low. The comment at the top of `rate-limit.ts` already warns about this. |

---

### FM‑SEC‑004 — Redirect validation in login is adequate but fragile

| Field | Value |
|-------|-------|
| **Rule** | NEXT-REDIRECT-001 |
| **Severity** | Low |
| **Location** | `src/app/login/login-form.tsx:15` |
| **Evidence** | `const redirectTo = rawRedirect && /^\/(?!\/)/.test(rawRedirect) ? rawRedirect : "/"` |
| **Impact** | The regex correctly blocks protocol-relative URLs (`//evil.com`) and absolute URLs. However, path traversal via encoded backslash (`/%5C`) or double-encoding is not explicitly prevented. In practice, `router.push()` treats these as relative paths, so the risk of open redirect to an external site is effectively eliminated. |
| **Fix** | Use `new URL(redirectTo, "http://localhost").origin === "http://localhost"` pattern for stricter validation, or use an allowlist of valid paths. |
| **Mitigation** | The current regex is sufficient for this single-user tool. No external attacker can exploit this to redirect to arbitrary hosts. |

---

### FM‑SEC‑005 — Session tokens are long-lived (30 days) with no rotation

| Field | Value |
|-------|-------|
| **Rule** | NEXT-SESS-002 |
| **Severity** | Low |
| **Location** | `src/lib/auth.ts:6, 31–37` |
| **Evidence** | `COOKIE_MAX_AGE = 30 * 24 * 60 * 60` (30 days); no session rotation mechanism. The token contains only `sub` (random UUID) and `exp`. |
| **Impact** | A compromised token remains valid for 30 days. No way to invalidate individual sessions without changing `AUTH_SECRET` (which logs out everyone). |
| **Fix** | Add session rotation on login (re-issue new token), reduce max age to 7 days, and add a session table to allow server-side revocation. |
| **Mitigation** | Single-user app with simple auth — the `sub` and `AUTH_SECRET` would need to be compromised together. Acceptable risk for the use case. |

---

### FM‑SEC‑006 — CSP uses deprecated `report-uri` directive

| Field | Value |
|-------|-------|
| **Rule** | NEXT-CSP-001 |
| **Severity** | Low |
| **Location** | `src/middleware.ts:16` |
| **Evidence** | `report-uri /api/csp-report` |
| **Impact** | `report-uri` is deprecated in CSP Level 3 in favor of `report-to`. Browsers still support it, but support may eventually be removed. |
| **Fix** | Replace `report-uri /api/csp-report` with `report-to csp-endpoint` and add a `Report-To` header. |
| **Mitigation** | Both directives are still widely supported. No immediate risk. |

---

## Areas Verified & Clean

| Check | Status | Notes |
|-------|--------|-------|
| **SQL Injection** | ✅ Clean | All queries use postgres.js parameterized tagged templates |
| **XSS (dangerouslySetInnerHTML)** | ✅ Clean | Not used anywhere in the codebase |
| **DOM XSS sinks** | ✅ Clean | No `innerHTML`, `document.write`, or similar |
| **Dynamic code execution** | ✅ Clean | No `eval`, `new Function`, or `vm.*` |
| **Secrets in git history** | ✅ Clean | No secrets found in commit history |
| **.env files committed** | ✅ Clean | `.env*` properly gitignored |
| **Secrets in client bundle** | ✅ Clean | No `process.env` in client components; no `NEXT_PUBLIC_` variables |
| **localStorage for auth** | ✅ Clean | Theme preference only; auth is in httpOnly cookies |
| **Auth on Server Actions** | ✅ Verified | Every action calls `requireAuth()` at the top |
| **Auth on API routes** | ✅ Verified | Middleware returns 401 for `/api/*` without valid cookie |
| **CSRF (SameSite cookies)** | ✅ Good | `sameSite: "lax"` on auth cookies |
| **HSTS** | ✅ Set | `max-age=63072000; includeSubDomains; preload` |
| **X-Frame-Options** | ✅ Set | `DENY` |
| **X-Content-Type-Options** | ✅ Set | `nosniff` |
| **Permissions-Policy** | ✅ Set | Restrictive (no camera, mic, geolocation) |
| **Referrer-Policy** | ✅ Set | `strict-origin-when-cross-origin` |
| **Content-Security-Policy** | ✅ Set | All major directives configured |
| **Server Action body size limit** | ✅ Set | 1 MB |
| **Rate limiting** | ✅ Implemented | Postgres-backed, exponential backoff, 10 attempts cap |
| **Input validation** | ✅ Good | Zod schemas on all form inputs; UUID validation on params |
| **Error handling** | ✅ Good | Generic messages to client (`"Erro ao salvar no banco"`); no stack leaks |

---

## Recommendations (Optional)

1. **Nonce-based CSP** (Medium) — Use Next.js nonces for inline scripts to tighten CSP and remove `'unsafe-inline'`.
2. **`allowedOrigins`** (Medium) — Add `allowedOrigins` to server actions for defense-in-depth against CSRF.
3. **IP reliability comment** (Low) — The existing comment in `rate-limit.ts` is good; consider a runtime check that warns if no reverse proxy is detected.
4. **Reduced session lifetime** (Low) — Consider 7-day expiration instead of 30.
5. **`report-to`** (Low) — Replace deprecated `report-uri` with `report-to` when convenient.

---

*Generated by `security-best-practices` skill — Next.js 16 + React 19 security spec*
