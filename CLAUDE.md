# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **Spec-Kit-driven** project. The single active feature is **Wrenfield Works Enterprise Site + CMS**
— a bilingual (EN/ไทย) marketing site that faithfully reproduces an approved design, plus a
self-hosted CMS for non-technical editors.

**Current state (branch `001-enterprise-site-cms`):** Phases 1–3 are implemented — the scaffold,
Payload collections/globals, i18n locale routing, theming, seed, and **User Story 1 (the public
bilingual site MVP)** are built and passing tests. **Not yet built:** the inquiry write-path
(`src/app/api/inquiries/`), email, cookieless analytics, and the 24-month retention job (User
Stories 2–3). Where this doc describes those in the present tense, treat them as the target design,
not shipped code.

The authoritative source of truth for *what* to build lives in `specs/001-enterprise-site-cms/`.
**Read `spec.md` and `plan.md` before writing any implementation code.** Other key artifacts:
`data-model.md`, `contracts/` (inquiry-api, content-api, admin-auth), `research.md`, `quickstart.md`,
`tasks.md` (87 ordered, test-first tasks), and `checklists/` (i18n, a11y, security, ux — all passing).

The original design handoff (HTML/CSS/JS prototype + assets to reproduce pixel-perfectly) is in
`docs/Frist Pilot-handoff.zip`.

## The Constitution is binding

`.specify/memory/constitution.md` (v1.0.1) defines 7 principles that gate all work. Two are
**NON-NEGOTIABLE** and change how you must operate here:

- **Security** — deny-by-default access; validate all external input; secrets via env only; TLS;
  dependency scan must pass before release.
- **Test-First Development (TDD)** — tests are **mandatory and written before** implementation
  (Red-Green-Refactor). `.specify/templates/tasks-template.md` is amended to make tests mandatory
  (not optional). A bug fix starts with a failing test.

Other gated principles: **i18n** (every user-facing string has EN *and* TH before publish), **UX**,
**Stability & Performance** (budgets + observability), **UI** (token-driven reusable components),
**Code Quality** (lint/format/type pass, ≥80% coverage on business-logic modules, review required).

## Stack & commands

Stack: **Next.js 16** (App Router, React 19) + **Payload CMS 3.85** (mounted in the same Next app) +
**PostgreSQL 16**, TypeScript, Tailwind v4 tokens. Node ≥ 20.9, pnpm 10. Hosted in an Asia/Singapore
region for PDPA data residency.

Commands (from `package.json`; the scaffold is in place, so these run today):

```bash
pnpm install
docker compose up -d db                  # local Postgres (prod is Singapore-region)
pnpm dev                                  # public site at /en and /th; admin at /admin
pnpm seed                                 # PAYLOAD_SEED=true payload run src/seed/seed.ts
pnpm generate:types                       # regenerate src/payload-types.ts after schema edits

pnpm test                                 # Vitest unit + integration (Payload Local API on a test DB)
pnpm test tests/unit/format.spec.ts       # run a single test file
pnpm test:e2e                             # Playwright journeys + @axe-core/playwright WCAG 2.1 AA
pnpm lint                                 # eslint . && prettier --check . && tsc --noEmit (all three)
pnpm lint:fix                             # eslint --fix + prettier --write
pnpm lhci                                 # Lighthouse CI — asserts performance budgets
```

Performance budgets (CI-enforced): LCP < 2.5s, INP < 200ms, CLS < 0.1, public route JS ≤ 200 KB
gzipped, "usable within 3s" on mid-tier mobile/4G.

## Architecture (big picture)

One Next.js application hosts **both** the public site and the Payload-powered back office, sharing
one Postgres database — no separate CMS service.

**As-built layout:** App Router uses two route groups — `src/app/(frontend)/[locale]/` (public,
per-locale) and `src/app/(payload)/` (admin UI + REST/GraphQL, never locale-prefixed) — plus
`src/app/health/route.ts`. Client design components live in
`src/components/{layout,primitives,sections,providers}/`. Design tokens are split across
`src/styles/{tokens,globals,components}.css` (ported from the prototype's `enterprise.css`). Access
control is deny-by-default in `src/access/`; the shared localized-field helper is in `src/fields/`.

- **Content model** (`src/collections/`, `src/globals/`): Payload *globals* are singletons (Hero,
  NavLabels, Marquee, SectionHeadings, Testimonial, CallToAction, Footer, SEOMetadata); *collections*
  are ordered/repeatable (Capabilities, CaseStudies, ProcessSteps, Stats, ClientLogos,
  ShowcaseSurfaces) plus Users, Media — and Inquiries (planned, US2). Localized fields carry separate
  EN/TH values; a shared publish-completeness hook blocks publishing when either locale is empty.
- **Public rendering** (`src/app/(frontend)/[locale]/`): reads *published* content via Payload's
  Local API (in-process, fast), rendered server-side/statically per locale; on-publish revalidation
  makes changes appear immediately. Bespoke design behavior (lattice canvas, custom cursor, magnetic
  buttons, scroll reveal, counters, showcase tabs) lives in client components built from a single
  design-token source ported from the prototype's `enterprise.css`.
- **Inquiries** (`src/app/api/inquiries/`): the only public *write* path — validates (Zod), spam-
  checks (challenge + honeypot + rate limit), persists with consent + a 24-month `expiresAt`, then
  best-effort emails the studio (email failure must never lose the stored inquiry).
- **Business logic** (`src/lib/`): today — content mapping, i18n, validation, logging, observability,
  richtext, theme, formatting, safe-href. Planned (US2–3) — email, analytics, retention. Kept here so
  each is independently unit-testable.

## Project-specific rules that bite (non-obvious)

- **Both EN and TH are required before publish** (FR-014) — this is enforced, not advisory.
- **Two themes ship**: dark (default) + paper/light with a persistent visitor toggle. AA contrast
  applies to *both* themes.
- **WCAG 2.1 AA applies to the public site AND the back-office editing UI.**
- **Inquiry retention** = *permanent deletion* of the whole record at 24 months (not anonymization);
  the retention job is monitored (alert + catch-up on failure).
- **Cookieless, privacy-friendly analytics only** — no cookie-consent banner.
- **Next.js 16 uses `src/proxy.ts`** (renamed from `middleware.ts`; export `proxy`, Node runtime) for
  EN/TH locale routing.
- Intentionally **English-only labels** are an explicit enumerated set (section numbers, mono
  category tags, KPI units, status pills, brand/client names); everything else is translatable prose.
- All personal data stays in the Singapore region; data in transit uses TLS.
- Env config lives in `.env.example` (copy to `.env`, never commit). It already enumerates the vars
  for DB, Payload secret, SMTP, Turnstile, analytics, S3 (`ap-southeast-1`), and retention months.

## Local automation already configured

- **Hooks** (`.claude/settings.json` → `.claude/hooks/`): a `PostToolUse` hook runs Prettier +
  ESLint `--fix` on changed files once the toolchain is installed. Type-checking is left to CI, not
  per-edit, for speed. (Keep secrets out of the repo via `.gitignore`; `.env*` must never be
  committed.)
- **Review agents** (`.claude/agents/`): `i18n-a11y-reviewer` and `pdpa-compliance-reviewer` — use
  them when reviewing UI/i18n or inquiry/privacy code.

## Git workflow

Work happens on a per-feature branch (`001-enterprise-site-cms`), created by the Spec Kit git
extension. Auto-commit is **disabled** (`.specify/extensions/git/git-config.yml`); commit explicitly.
PRs target `main`.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/001-enterprise-site-cms/plan.md`

Active feature: **Wrenfield Works Enterprise Site + CMS** (`001-enterprise-site-cms`)
Stack: Next.js 16 (App Router) + Payload CMS 3.x + PostgreSQL 16, TypeScript, Tailwind tokens.
Note: Next.js 16 uses `proxy.ts` (not `middleware.ts`) for EN/TH locale routing; Node ≥ 20.9.
Hosted in Singapore region (PDPA). Bilingual EN/TH. See plan.md, research.md, data-model.md,
and contracts/ in that feature directory.
<!-- SPECKIT END -->
