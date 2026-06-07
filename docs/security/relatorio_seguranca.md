# Relatório de Revisão de Segurança — FM-Construct

**Data:** 2026-06-06  
**Escopo:** Aplicação full-stack Next.js 16 com Neon Postgres, auto-hospedada ou on Vercel  
**Tipo de revisão:** Auditoria ativa (conforme skill `security-best-practices` + especificações de segurança Next.js/React)

---

## Resumo Executivo

O FM-Construct é uma ferramenta de gestão de construção civil para um único usuário com uma **base de segurança sólida**. O código:

- ✅ Usa **consultas parametrizadas** (tagged templates do postgres.js) — sem SQL injection
- ✅ Armazena tokens de autenticação em **cookies httpOnly e SameSite** — não em localStorage
- ✅ Não possui `dangerouslySetInnerHTML`, `eval` ou sinks de XSS no DOM
- ✅ Define **CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy**
- ✅ Limpa a conexão com o banco a cada requisição (padrão serverless via `@neondatabase/serverless`)
- ✅ **Ignora arquivos `.env*`** no git — nenhum segredo no histórico
- ✅ Aplica **autenticação server-side** em todas as actions que alteram estado (`requireAuth()`)
- ✅ Possui **rate limiting** no login (baseado em Postgres, backoff exponencial)
- ✅ Nenhuma variável `NEXT_PUBLIC_` expondo segredos ao navegador

**3 achados de severidade Média** e **3 observações de severidade Baixa** foram identificados. Nenhum problema Crítico ou Alto foi encontrado. O projeto segue as boas práticas de segurança para seu escopo (ferramenta interna de um usuário com autenticação simples).

---

## Achados

### FM‑SEC‑001 — CSP usa `'unsafe-inline'` para scripts

| Campo | Valor |
|-------|-------|
| **Regra** | NEXT-CSP-001 |
| **Severidade** | Média |
| **Local** | `src/middleware.ts:10` |
| **Evidência** | `script-src 'self' 'unsafe-inline' https://vercel.live${isDev ? " 'unsafe-eval'" : ""}` |
| **Impacto** | Qualquer vulnerabilidade XSS pode executar scripts arbitrários inline; o CSP não consegue bloqueá-la. Em modo dev, `'unsafe-eval'` também é adicionado. |
| **Correção** | Usar **CSP baseado em nonce**: gerar um nonce único por requisição no middleware, passar para Server Components/scripts do Next.js. O Next.js suporta CSP com nonce via `next/script`. |
| **Mitigação** | Não existem `dangerouslySetInnerHTML` ou sinks de injeção no DOM, e o escaping padrão do React reduz o risco de XSS. O `'unsafe-inline'` é praticamente inevitável no Next.js atual (scripts inline de hidratação). É um trade-off aceito para a maioria das apps Next.js. |

---

### FM‑SEC‑002 — Server Actions permitem todas as origens (sem `allowedOrigins`)

| Campo | Valor |
|-------|-------|
| **Regra** | NEXT-CSRF-001 |
| **Severidade** | Média |
| **Local** | `next.config.ts` (sem chave `allowedOrigins` em `serverActions`) |
| **Evidência** | Apenas `bodySizeLimit: "1mb"` está configurado; sem `allowedOrigins`, qualquer origem pode invocar Server Actions |
| **Impacto** | CSRF (Cross-Site Request Forgery) nas Server Actions. Porém, a app usa cookies `sameSite: "lax"`, que bloqueia a maioria das requisições POST cross-site, e todas as actions exigem autenticação. |
| **Correção** | Adicionar `allowedOrigins: [process.env.APP_ORIGIN].filter(Boolean)` no `next.config.ts` na config serverActions. |
| **Mitigação** | O cookie `SameSite=Lax` e a autenticação server-side (`requireAuth()`) em toda action fornecem forte defesa em profundidade. |

---

### FM‑SEC‑003 — Rate limiting depende do IP `x-forwarded-for` do cliente

| Campo | Valor |
|-------|-------|
| **Regra** | NEXT-DOS-001 |
| **Severidade** | Média |
| **Local** | `src/lib/rate-limit.ts` (arquivo inteiro, especialmente linhas 10–12) |
| **Evidência** | A função `checkRateLimit` recebe `ip: string` de quem a chama. Em `src/actions/auth.ts`, o IP é extraído de `request.headers.get("x-forwarded-for")`. Um proxy reverso mal configurado (ou ausente) permitiria falsificação de IP. |
| **Impacto** | Um atacante por trás de um proxy poderia falsificar seu IP e burlar os limites de taxa, possibilitando tentativas de brute-force no login. Na Vercel isso é gerenciado. |
| **Correção** | Documentar em um comentário que a app REQUER um proxy reverso para sanitizar `x-forwarded-for`. Alternativamente, usar `request.headers.get("cf-connecting-ip")` no Cloudflare, ou `request.ip` quando disponível. |
| **Mitigação** | Aplicativo de um único usuário; risco de brute-force é baixo. O comentário no topo de `rate-limit.ts` já alerta sobre isso. |

---

### FM‑SEC‑004 — Validação de redirect é adequada mas frágil

| Campo | Valor |
|-------|-------|
| **Regra** | NEXT-REDIRECT-001 |
| **Severidade** | Baixa |
| **Local** | `src/app/login/login-form.tsx:15` |
| **Evidência** | `const redirectTo = rawRedirect && /^\/(?!\/)/.test(rawRedirect) ? rawRedirect : "/"` |
| **Impacto** | A regex bloqueia corretamente URLs relativas a protocolo (`//evil.com`) e URLs absolutas. No entanto, path traversal via barra invertida codificada (`/%5C`) ou dupla codificação não é explicitamente impedido. Na prática, `router.push()` trata estes como caminhos relativos, então o risco de redirect aberto para um site externo é efetivamente eliminado. |
| **Correção** | Usar o padrão `new URL(redirectTo, "http://localhost").origin === "http://localhost"` para validação mais rigorosa, ou usar uma lista de permissão de caminhos válidos. |
| **Mitigação** | A regex atual é suficiente para esta ferramenta de um único usuário. Nenhum atacante externo pode explorar isso para redirecionar para hosts arbitrários. |

---

### FM‑SEC‑005 — Tokens de sessão são duradouros (30 dias) sem rotação

| Campo | Valor |
|-------|-------|
| **Regra** | NEXT-SESS-002 |
| **Severidade** | Baixa |
| **Local** | `src/lib/auth.ts:6, 31–37` |
| **Evidência** | `COOKIE_MAX_AGE = 30 * 24 * 60 * 60` (30 dias); sem mecanismo de rotação de sessão. O token contém apenas `sub` (UUID aleatório) e `exp`. |
| **Impacto** | Um token comprometido permanece válido por 30 dias. Não há como invalidar sessões individuais sem mudar `AUTH_SECRET` (o que deslogaria todos). |
| **Correção** | Adicionar rotação de sessão no login (re-emitir novo token), reduzir o max age para 7 dias, e adicionar uma tabela de sessão para permitir revogação server-side. |
| **Mitigação** | Aplicativo de um único usuário com autenticação simples — o `sub` e `AUTH_SECRET` precisariam ser comprometidos juntos. Risco aceitável para o caso de uso. |

---

### FM‑SEC‑006 — CSP usa diretiva `report-uri` depreciada

| Campo | Valor |
|-------|-------|
| **Regra** | NEXT-CSP-001 |
| **Severidade** | Baixa |
| **Local** | `src/middleware.ts:16` |
| **Evidência** | `report-uri /api/csp-report` |
| **Impacto** | `report-uri` está depreciado no CSP Level 3 em favor de `report-to`. Navegadores ainda suportam, mas o suporte pode ser removido no futuro. |
| **Correção** | Substituir `report-uri /api/csp-report` por `report-to csp-endpoint` e adicionar um cabeçalho `Report-To`. |
| **Mitigação** | Ambas as diretivas ainda são amplamente suportadas. Nenhum risco imediato. |

---

## Áreas Verificadas e Limpas

| Verificação | Status | Notas |
|------------|--------|-------|
| **SQL Injection** | ✅ Limpo | Todas as consultas usam tagged templates parametrizados do postgres.js |
| **XSS (dangerouslySetInnerHTML)** | ✅ Limpo | Não usado em nenhum lugar do código |
| **Sinks de XSS no DOM** | ✅ Limpo | Sem `innerHTML`, `document.write` ou similares |
| **Execução dinâmica de código** | ✅ Limpo | Sem `eval`, `new Function` ou `vm.*` |
| **Segredos no histórico do git** | ✅ Limpo | Nenhum segredo encontrado no histórico de commits |
| **Arquivos .env commitados** | ✅ Limpo | `.env*` devidamente ignorado pelo git |
| **Segredos no bundle do cliente** | ✅ Limpo | Sem `process.env` em componentes cliente; sem variáveis `NEXT_PUBLIC_` |
| **localStorage para autenticação** | ✅ Limpo | Apenas preferência de tema; autenticação está em cookies httpOnly |
| **Autenticação nas Server Actions** | ✅ Verificado | Toda action chama `requireAuth()` no início |
| **Autenticação nas rotas de API** | ✅ Verificado | Middleware retorna 401 para `/api/*` sem cookie válido |
| **CSRF (cookies SameSite)** | ✅ Bom | `sameSite: "lax"` nos cookies de autenticação |
| **HSTS** | ✅ Configurado | `max-age=63072000; includeSubDomains; preload` |
| **X-Frame-Options** | ✅ Configurado | `DENY` |
| **X-Content-Type-Options** | ✅ Configurado | `nosniff` |
| **Permissions-Policy** | ✅ Configurado | Restritivo (sem câmera, microfone, geolocalização) |
| **Referrer-Policy** | ✅ Configurado | `strict-origin-when-cross-origin` |
| **Content-Security-Policy** | ✅ Configurado | Todas as diretivas principais configuradas |
| **Limite de tamanho do body das Server Actions** | ✅ Configurado | 1 MB |
| **Rate limiting** | ✅ Implementado | Baseado em Postgres, backoff exponencial, limite de 10 tentativas |
| **Validação de entrada** | ✅ Bom | Schemas Zod em todos os formulários; validação UUID nos parâmetros |
| **Tratamento de erros** | ✅ Bom | Mensagens genéricas ao cliente (`"Erro ao salvar no banco"`); sem vazamento de stack |

---

## Recomendações (Opcionais)

1. **CSP baseado em nonce** (Média) — Usar nonces do Next.js para scripts inline para fortalecer o CSP e remover `'unsafe-inline'`.
2. **`allowedOrigins`** (Média) — Adicionar `allowedOrigins` nas server actions para defesa em profundidade contra CSRF.
3. **Comentário de confiabilidade do IP** (Baixa) — O comentário existente em `rate-limit.ts` é bom; considerar uma verificação em runtime que avise se nenhum proxy reverso for detectado.
4. **Redução do tempo de vida da sessão** (Baixa) — Considerar expiração de 7 dias em vez de 30.
5. **`report-to`** (Baixa) — Substituir `report-uri` depreciado por `report-to` quando conveniente.

---

*Gerado pela skill `security-best-practices` — especificação de segurança Next.js 16 + React 19*
