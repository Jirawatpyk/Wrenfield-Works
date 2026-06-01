# Quickstart: Wrenfield Works Enterprise Site + CMS

Local setup and the core verification flows for the feature.

## Prerequisites

- Node.js 22 LTS + a package manager (pnpm recommended)
- Docker (for local PostgreSQL) or a local Postgres 16 instance
- An `.env` file (never commit it) with at least:
  - `DATABASE_URI` — Postgres connection string
  - `PAYLOAD_SECRET` — server secret
  - `SMTP_*` / transactional email provider credentials
  - `TURNSTILE_SECRET` / `TURNSTILE_SITE_KEY`
  - `ANALYTICS_*` — cookieless analytics endpoint
  - `S3_*` — in-region object storage for media

## Install & run

```bash
pnpm install
docker compose up -d db          # local Postgres (Singapore-region in prod)
pnpm dev                         # Next.js app: public site + /admin (Payload)
```

- Public site: `http://localhost:3000/en` and `/th`
- Back office: `http://localhost:3000/admin` (create the first staff user on first run)
- Seed bilingual content from the approved design's EN/TH copy: `pnpm seed`

## Test (test-first — Constitution Principle II)

```bash
pnpm test            # Vitest unit + integration (Payload Local API on a test DB)
pnpm test:e2e        # Playwright journeys + axe WCAG 2.1 AA checks
pnpm lint            # ESLint + Prettier + TypeScript
pnpm lhci            # Lighthouse CI — asserts performance budgets
```

Write the failing test first, watch it fail, then implement. Coverage must stay ≥ the 80% baseline
on business-logic modules.

## Verify the user stories

### US1 — Public bilingual site
1. Open `/en`; confirm all sections render with English content.
2. Switch to ไทย; confirm prose translates and the language persists on reload.
3. Resize 360px → 1440px; no horizontal scroll/overlap.
4. Enable OS "reduce motion"; confirm decorative animation is disabled, content intact.
5. Run `pnpm test:e2e` — axe AA checks pass; tab through with keyboard.

### US2 — CMS content management
1. Sign in to `/admin`. Confirm an unauthenticated window is redirected to sign-in.
2. Edit the Hero headline in EN **and** TH; save as draft; use Preview.
3. Try to publish with TH empty → publish is blocked with a clear message.
4. Fill TH, publish → change appears on the public site immediately.
5. Add / remove / reorder a Capability; confirm the public order updates after publish.
6. Open the same doc in two sessions, edit both, save the second → conflict warning (no overwrite).

### US3 — Inquiry (PDPA)
1. Submit the inquiry form without consent → blocked.
2. Submit a valid inquiry with consent → on-page confirmation shown.
3. Confirm a studio notification email is sent (and that simulating an email failure does **not**
   lose the stored inquiry).
4. In `/admin`, open the inbox → the inquiry appears with name, email, message, locale, time.
5. Confirm `expiresAt` is 24 months out; run the retention job against a back-dated record → removed.
6. Delete an inquiry on request → fully removed.

## Definition of done (gates)

- All tests pass; coverage ≥ 80% baseline; lint/format/type clean.
- axe AA clean + manual keyboard/SR pass.
- Lighthouse budgets met (LCP < 2.5s, INP < 200ms, CLS < 0.1, JS ≤ 200KB).
- No published content missing EN or TH.
- Dependency scan: no unresolved high/critical CVEs; no secrets in source.
