# Implementation Plan: Wrenfield Works Enterprise Site + CMS

**Branch**: `001-enterprise-site-cms` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-enterprise-site-cms/spec.md`

## Summary

Build the public, bilingual (EN/ไทย) Wrenfield Works "Enterprise" marketing site as a faithful
reproduction of the approved design, backed by a self-hosted CMS that lets non-technical staff
manage every piece of on-page content (and SEO/social metadata) in both languages, plus a
PDPA-compliant inquiry capture flow with email notification.

Technical approach: a single **Next.js (App Router)** application with **Payload CMS** embedded in
the same project and **PostgreSQL** as the data store. Next.js renders the public site
server-side/statically per locale for SEO and performance; Payload provides the admin UI, auth,
field-level EN/TH localization, draft→publish with preview, document versions (for optimistic
concurrency), and access control. Inquiries are a Payload collection with consent + 24-month
retention; a privacy-friendly **cookieless analytics** tool captures aggregate metrics with no
cookie banner. Everything is hosted in an Asia (Singapore) region for PDPA data residency.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS

**Primary Dependencies**: Next.js 16 (App Router, React 19), Payload CMS 3.x (runs inside the Next.js
app), Drizzle-based Postgres adapter (`@payloadcms/db-postgres`), Tailwind CSS 4 (design tokens) +
CSS for bespoke animation, Zod for input validation, Pino for structured logging, React Email +
an SMTP/transactional provider for notifications, a cookieless analytics tool (Plausible or Umami,
self-hosted in-region), Cloudflare Turnstile (or equivalent privacy-friendly CAPTCHA) for spam.

**Storage**: PostgreSQL 16 (managed, Singapore region). Media (social-share/OG images, any uploads)
in object storage (S3-compatible, Singapore region) via Payload's upload adapter.

**Testing**: Vitest (unit + integration), Payload Local API for integration tests against a test
Postgres, Playwright (end-to-end + `@axe-core/playwright` for WCAG 2.1 AA checks), ESLint + Prettier.

**Target Platform**: Modern evergreen browsers per Next.js 16 baseline (Chrome/Edge/Firefox 111+,
Safari 16.4+), desktop + mobile; server runtime Node.js 22 LTS (Next.js 16 requires ≥ 20.9) in an
Asia-Pacific (Singapore, e.g. `ap-southeast-1`) region.

> **Next.js 16 note**: locale routing for EN/TH uses the renamed `proxy.ts` convention (v16 renamed
> `middleware.ts` → `proxy.ts`, export `middleware` → `proxy`); `proxy` runs on the Node runtime
> (no edge), which is fine for our in-region Node deployment.

**Project Type**: Web application (single Next.js project hosting both the public frontend and the
Payload-powered back office).

**Performance Goals** (public site, mid-tier mobile on 4G):
- Largest Contentful Paint (LCP) < 2.5s; Interaction to Next Paint (INP) < 200ms; CLS < 0.1.
- Public route initial JS ≤ 200 KB gzipped; fonts loaded without layout shift (variable fonts,
  `font-display: swap`).
- Content read p95 < 300ms; inquiry submission round-trip p95 < 800ms.
- Site interactive within 3s (satisfies SC-007).

**Constraints**:
- PDPA data residency: all personal data (inquiries) stored and processed in the Singapore region.
- Inquiry personal data auto-removed/anonymized at 24 months (FR-027).
- No cookie-consent banner — analytics MUST be cookieless (FR-011b).
- Both EN and TH values required before any content can be published (FR-014).
- Reduced-motion preference fully honored (FR-006); WCAG 2.1 AA on **both** the public site and the
  back-office UI (FR-007).
- Two themes ship — dark (default) + paper/light — with a persistent visitor toggle (FR-005b); both
  must meet AA contrast. (The design tokens already define a `body.paper` override to build on.)

**Scale/Scope**: One marketing page composed of ~11 sections; bilingual; a handful of trusted staff
editors; low write volume, read-heavy public traffic (served via static/ISR + CDN).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.0.1 — all seven principles mapped to concrete gates for this feature:

| # | Principle | How this plan satisfies it | Gate |
|---|-----------|-----------------------------|------|
| I | Security (NON-NEGOTIABLE) | Payload access control deny-by-default on all collections/admin; Zod validation on all external input (inquiry form, API); secrets via env only; TLS enforced; passwords hashed by Payload (bcrypt); CSRF protection on mutations; dependency vulnerability scan in CI | No unauthenticated back-office access; no secrets in source; high/critical CVEs blocked |
| II | Test-First (NON-NEGOTIABLE) | TDD red-green-refactor; tests written before implementation for every task; bug fixes start with a failing test; contract + integration tests for inquiry API, access control, retention job, publish-completeness | Tests authored first; coverage ≥ baseline (below); CI blocks on test failure |
| III | Internationalization (TH/EN) | Payload field-level localization (en default, th); publish blocked unless both locales present; locale-aware Next.js rendering; Thai typography (leading/size) per design; locale-aware formatting | 100% published content has EN+TH; no hardcoded user-facing strings |
| IV | UX | Explicit loading/empty/error states; localized, actionable error messages; graceful translation fallback; WCAG 2.1 AA (keyboard, focus, contrast, screen-reader labels) | axe AA checks pass; manual keyboard/SR pass; no silent failures |
| V | Stability & Performance | Performance budgets above verified in CI (Lighthouse CI); explicit error handling; Pino structured logging **plus metrics/tracing on critical paths (publish, inquiry, retention) and a health endpoint**; timeouts + failure isolation on email/analytics (email failure never loses an inquiry — FR-029); graceful content-load fallback | Budgets met or justified; observability present on critical paths; email/analytics failures isolated |
| VI | UI | Reusable component library driven by a single design-token source (ported from `enterprise.css`); responsive across 360px→1440px+; defined visual states (hover/focus/active/disabled/error/empty/loading) | Tokens are source of truth; no ad-hoc inline styles bypassing tokens |
| VII | Code Quality | Modular structure (collections/globals/components/lib); ESLint+Prettier+TypeScript strict in CI; PR review required; public APIs documented; reuse over duplication | Lint/format/type pass; review approved |

**Coverage baseline** (Constitution Test gate): minimum **80%** statements & branches on
business-logic modules (`src/lib/**`, collection hooks, access-control, validation, retention job,
email) — excluding generated Payload types, config, and pure presentational components; critical
user journeys covered by Playwright e2e.

**Initial Constitution Check: PASS** — no violations; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-enterprise-site-cms/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── content-api.md       # Public content read contract (per-locale)
│   ├── inquiry-api.md       # Public inquiry submission contract
│   └── admin-auth.md        # Back-office auth + access-control contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (frontend)/
│   │   └── [locale]/         # public site, locale-segmented (en | th)
│   │       ├── layout.tsx
│   │       └── page.tsx      # composes the section components
│   ├── (payload)/            # Payload admin UI + REST/GraphQL (auto-mounted)
│   └── api/
│       └── inquiries/        # public inquiry submission route (validation, spam, email)
├── collections/             # Payload collections (repeatable + auth + media)
│   ├── Capabilities.ts
│   ├── CaseStudies.ts
│   ├── ProcessSteps.ts
│   ├── Stats.ts
│   ├── ClientLogos.ts
│   ├── ShowcaseSurfaces.ts
│   ├── Inquiries.ts
│   ├── Users.ts
│   └── Media.ts
├── globals/                 # Payload globals (singletons)
│   ├── Hero.ts  Testimonial.ts  CallToAction.ts  Footer.ts
│   ├── SectionHeadings.ts  NavLabels.ts  Marquee.ts  SEOMetadata.ts
├── components/              # reusable UI library (design-token driven)
│   ├── layout/ (Nav, Footer, LangToggle, CustomCursor)
│   ├── sections/ (Hero, Marquee, Stats, Capabilities, Showcase, Work, Process, Testimonial, CTA)
│   └── primitives/ (Button, Pill, Reveal, Counter, LatticeCanvas)
├── lib/                     # business logic (heavily unit-tested)
│   ├── i18n.ts  content.ts  email.ts  analytics.ts
│   ├── validation/ (inquiry.ts …)  logging.ts  retention.ts
├── styles/                  # tokens.css (ported from enterprise.css), globals.css
└── payload.config.ts        # collections, globals, localization (en/th), db, access

tests/
├── unit/                    # lib/** + hooks (Vitest)
├── integration/             # Payload Local API against test Postgres
└── e2e/                     # Playwright journeys + axe AA checks
```

**Structure Decision**: Single Next.js + Payload application (Project Type: web application). Payload
3.x mounts inside the Next.js App Router, so the public site, admin UI, and content APIs share one
deployable. Business logic lives in `src/lib` (independently unit-testable per Principle VII);
presentation lives in `src/components` built from a single token source (Principle VI).

## Complexity Tracking

> No constitutional violations. No complexity deviations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                    |

## Post-Design Constitution Re-Check

Re-evaluated after Phase 1 (data-model, contracts, quickstart): **PASS**. The design introduces no
new constitutional risk — localization completeness is enforced by a Payload publish hook, the
inquiry contract carries explicit consent + a server-set 24-month expiry, access control is
deny-by-default, and email/analytics failures are isolated from the inquiry write path. Complexity
Tracking remains empty.
