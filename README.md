# Wrenfield Works — Enterprise Site + CMS

Wrenfield Works is a bilingual (EN/ไทย) enterprise marketing site with an embedded, self-hosted CMS. It is a single Next.js application that serves the public site and hosts the Payload admin UI and content APIs on top of one PostgreSQL database. Non-technical staff edit every piece of on-page content (and SEO/social metadata) in both languages, with a draft → preview → publish flow and an enforced EN+TH publish-completeness gate. The site also captures PDPA-compliant inquiries (consent + a server-set 24-month expiry), sends a failure-isolated studio notification email, and reports aggregate traffic via cookieless analytics — no cookie banner. All personal data is hosted in the Asia/Singapore region for data residency.

## Tech stack

- **Next.js 16** (App Router, React 19) — public site + API routes
- **Payload CMS 3.85** — admin UI, auth, EN/TH field localization, drafts/versions, access control (mounted inside the same Next.js app)
- **PostgreSQL 16** — single shared database (`@payloadcms/db-postgres`)
- **TypeScript**, **Tailwind v4** design tokens
- **Zod** (input validation), **Pino** (structured logging)
- **Cloudflare Turnstile** (spam defense), cookieless analytics (Plausible/Umami)
- Optional **S3** media storage (`@payloadcms/storage-s3`, `ap-southeast-1`) and SMTP email (`@payloadcms/email-nodemailer`)
- **Vitest** (unit + integration), **Playwright** + `@axe-core/playwright` (e2e + WCAG), **Lighthouse CI**
- **Node ≥ 20.9**, **pnpm 10**. Hosted in Asia/Singapore (`ap-southeast-1`) for PDPA residency.

## Prerequisites

- **Node.js ≥ 20.9** (22 LTS recommended)
- **pnpm 10**
- **Docker** (for local PostgreSQL) — or a local Postgres 16 instance

## Quick start

```bash
pnpm install
docker compose up -d db          # local Postgres (Singapore-region in prod)
cp .env.example .env             # then fill in the values (never commit .env)
pnpm dev                         # Next.js app: public site + Payload admin
pnpm seed                        # bootstrap first staff user + seed bilingual content
```

Then open:

- Public site (English): http://localhost:3000/en
- Public site (ไทย): http://localhost:3000/th
- Back office (Payload admin): http://localhost:3000/admin

`pnpm seed` is idempotent: it creates the first staff user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (and refuses the default password in production) and seeds the approved EN/TH design copy.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the Next.js dev server (public `/en`, `/th` + `/admin`) |
| `pnpm build` | Production build of the Next.js + Payload app |
| `pnpm start` | Serve the production build |
| `pnpm seed` | Bootstrap the first staff user and seed bilingual content (idempotent) |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after schema edits |
| `pnpm test` | Vitest unit + integration tests (Payload Local API on a test DB) |
| `pnpm test:ci` | Reset the test DB, then run all tests with coverage |
| `pnpm test:e2e` | Playwright end-to-end journeys + axe WCAG 2.1 AA checks |
| `pnpm lint` | ESLint + Prettier `--check` + `tsc --noEmit` (all three) |
| `pnpm lhci` | Lighthouse CI — asserts the performance budgets |
| `pnpm retention` | Run the PDPA retention job (permanently deletes inquiries older than 24 months) |

## Architecture

One Next.js application hosts the **public site**, the **Payload admin UI**, and the **content/inquiry APIs**, all sharing a **single PostgreSQL database** — no separate CMS service to deploy.

Route groups in `src/app/`:

- `src/app/(frontend)/[locale]/` — the public site, per-locale (`en` | `th`), rendered server-side/statically for SEO and performance.
- `src/app/(payload)/` — the Payload admin UI plus REST/GraphQL endpoints (auto-mounted; never locale-prefixed).

Locale routing uses `src/proxy.ts` — Next.js 16 renamed `middleware.ts` → `proxy.ts` (export `proxy`, Node runtime).

`src/` layout:

- `src/app/` — App Router routes (route groups above) and API routes
- `src/collections/` — Payload collections (repeatable/ordered content, Users, Media, Inquiries)
- `src/globals/` — Payload globals (singletons: Hero, Footer, SEO metadata, etc.)
- `src/components/` — reusable, design-token-driven UI library (`layout/`, `sections/`, `primitives/`, `providers/`)
- `src/lib/` — independently unit-testable business logic (i18n, content mapping, validation, email, analytics, logging, revalidation)
- `src/styles/` — Tailwind v4 design tokens (`tokens.css`, `globals.css`, `components.css`)
- `src/access/` — deny-by-default access control; `src/fields/` — shared localized-field helpers
- `src/proxy.ts` — EN/TH locale routing
- `src/jobs/retention.ts` — the PDPA retention job

**Inquiry write-path:** the only public write path is `POST /api/inquiries/submit` (`src/app/api/inquiries/submit/`). It validates with Zod and applies layered spam defense — per-IP rate limit + honeypot + Cloudflare Turnstile (fail-closed) — then persists the inquiry with the visitor's consent and a server-set 24-month `expiresAt`, and best-effort emails the studio (email failure never loses the stored inquiry). Note: `/api/inquiries` (without `/submit`) belongs to Payload's own collection REST API, not the public form.

**Retention job:** `src/jobs/retention.ts`, run via `pnpm retention`, permanently **deletes** (PDPA — not anonymization) inquiries older than 24 months. It is idempotent with catch-up and is monitored; schedule it daily with an in-region cron.

**Conditional integrations** (wired only when configured, otherwise sensible local defaults):

- **Email** (`src/lib/email.ts`) — transactional transport via `@payloadcms/email-nodemailer` only when `SMTP_HOST` is set (else logs to console); recipient is `INQUIRY_NOTIFY_TO`.
- **Media/OG images** — S3 storage (`@payloadcms/storage-s3`, `ap-southeast-1`) only when `S3_BUCKET` is set (else local disk).
- **Analytics** — cookieless script injected only when `NEXT_PUBLIC_ANALYTICS_DOMAIN` and `NEXT_PUBLIC_ANALYTICS_SCRIPT_URL` are set; no cookie-consent banner (FR-011b).

## Testing & quality gates

Quality is gated by the project Constitution (`.specify/memory/constitution.md`). **Security** and **Test-First Development** are NON-NEGOTIABLE; **i18n**, **UX**, **Stability & Performance**, **UI**, and **Code Quality** are also enforced.

- **TDD is mandatory** — write the failing test first, watch it fail, then implement (red-green-refactor). Bug fixes start with a failing test.
- **Coverage ≥ 80%** statements and branches on business-logic modules (`src/lib/**`, collection hooks, access control, validation, retention, email).
- **Accessibility** — `@axe-core/playwright` WCAG 2.1 AA checks, on both the public site **and** the back-office UI, across **both** themes (dark default + paper), via `pnpm test:e2e`.
- **Performance budgets** (Lighthouse CI, `pnpm lhci`) — LCP < 2.5s, INP < 200ms, CLS < 0.1, public route JS ≤ 200 KB gzipped.
- **CI gates** — `pnpm lint` (ESLint + Prettier + TypeScript) must pass; dependency vulnerability scan blocks unresolved high/critical CVEs; secret scan ensures no secrets in source (`.env*` is never committed).
- No published content may be missing EN or TH (FR-014, enforced by a publish-completeness hook).

## Deployment & PDPA notes

Deploy in the Asia/Singapore region (`ap-southeast-1`) so all personal data stays in-region. Serve over TLS with HSTS. Schedule `pnpm retention` daily via an in-region cron to permanently delete inquiries older than 24 months. Analytics are cookieless, so there is no cookie-consent banner. Two themes ship (dark default + paper) with a persistent visitor toggle, both meeting AA contrast.

For the full operations runbook (env vars, cron setup, backups, incident handling), see [`docs/handover.md`](docs/handover.md).

## Project docs

- Feature spec, plan, and contracts: [`specs/001-enterprise-site-cms/`](specs/001-enterprise-site-cms/) — see `spec.md`, `plan.md`, `quickstart.md`, `research.md`, `data-model.md`, and `contracts/`
- Operations & handover runbook: [`docs/handover.md`](docs/handover.md)
- Accessibility notes & test approach: [`docs/accessibility.md`](docs/accessibility.md)
