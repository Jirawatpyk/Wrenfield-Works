---
description: "Task list for Wrenfield Works Enterprise Site + CMS"
---

# Tasks: Wrenfield Works Enterprise Site + CMS

**Input**: Design documents from `/specs/001-enterprise-site-cms/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: MANDATORY per Constitution Principle II (Test-First, NON-NEGOTIABLE). Test tasks are
written BEFORE their implementation tasks and must FAIL first (Red-Green-Refactor).

**Stack**: Next.js 16 (App Router, React 19) + Payload CMS 3.x + PostgreSQL 16, TypeScript, Tailwind
tokens. Hosted Singapore region (PDPA). Bilingual EN/TH, dark + paper themes.

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish carry no story label)

## Path Conventions

Single Next.js + Payload app at repo root: `src/app`, `src/collections`, `src/globals`,
`src/components`, `src/lib`, `src/styles`; tests in `tests/{unit,integration,e2e}`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling.

- [X] T001 Initialize Next.js 16 + TypeScript (App Router, React 19) project at repo root per plan.md
- [X] T002 Add Payload CMS 3.x, `@payloadcms/db-postgres`, and core deps; create skeleton `src/payload.config.ts`
- [X] T003 [P] Configure ESLint + Prettier + TypeScript strict (`eslint.config.mjs`, `.prettierrc`, `tsconfig.json`)
- [X] T004 [P] Set up test harness: Vitest, Playwright, `@axe-core/playwright` (`vitest.config.ts`, `playwright.config.ts`, `tests/` dirs)
- [X] T005 [P] Add `docker-compose.yml` (local Postgres 16) and `.env.example` with all required vars (DATABASE_URI, PAYLOAD_SECRET, SMTP_*, TURNSTILE_*, ANALYTICS_*, S3_*)
- [X] T006 [P] Port design tokens from `enterprise.css` into `src/styles/tokens.css` (both dark and paper palettes) and Tailwind theme config
- [X] T007 [P] Load web fonts (Fraunces, Hanken Grotesk, JetBrains Mono, Trirong/Anuphan/IBM Plex Sans Thai) with `font-display: swap` in `src/lib/fonts.ts`
- [X] T008 Set up CI pipeline (lint, type-check, unit/integration/e2e, Lighthouse CI, dependency scan, coverage) in `.github/workflows/ci.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schema, localization, auth, routing, theming that ALL stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T009 Configure Postgres adapter + connection in `src/payload.config.ts` (env `DATABASE_URI`)
- [X] T010 Enable Payload localization: locales `en` (default) + `th` in `src/payload.config.ts`
- [X] T011 [P] Define `Users` collection (auth, single staff role, deny-by-default access) in `src/collections/Users.ts`
- [X] T012 [P] Define `Media` collection (uploads, in-region storage adapter, localized `alt`) in `src/collections/Media.ts`
- [X] T013 [P] Define ordered content collections (drafts+versions, localized fields) — `Capabilities`, `CaseStudies`, `ProcessSteps`, `Stats`, `ClientLogos`, `ShowcaseSurfaces` in `src/collections/*.ts` (data-model.md)
- [X] T014 [P] Define globals (drafts+versions, localized) — `Hero`, `NavLabels`, `Marquee`, `SectionHeadings`, `Testimonial`, `CallToAction`, `Footer`, `SEOMetadata` in `src/globals/*.ts`
- [X] T015 Implement shared publish-completeness hook (block publish if any localized field missing EN or TH) in `src/lib/validation/publishCompleteness.ts` and wire into all collections/globals
- [X] T016 [P] Set up structured logging (Pino) in `src/lib/logging.ts`
- [X] T016a [P] Set up observability — metrics + tracing on critical paths (publish, inquiry submission, retention job) and a health endpoint — in `src/lib/observability.ts` (Constitution Principle V)
- [X] T017 Implement locale routing via Next.js 16 `src/proxy.ts` (default-locale redirect, `/en` `/th` segments) + persistence helper in `src/lib/i18n.ts`
- [X] T018 Implement theme system (dark default + paper) with persistent visitor toggle in `src/lib/theme.ts` + theme provider, wired to tokens (FR-005b)
- [X] T019 Create base locale layout + providers (theme, locale) + global styles in `src/app/(frontend)/[locale]/layout.tsx` and `src/styles/globals.css`
- [X] T020 Create content seed script (EN/TH copy from the approved design) in `src/seed/seed.ts` (`pnpm seed`)

**Checkpoint**: Schema, auth, localization, routing, theming ready — user stories can begin.

---

## Phase 3: User Story 1 - Visitor explores the bilingual marketing site (Priority: P1) 🎯 MVP

**Goal**: A faithful, bilingual, accessible, responsive public site rendering published content in
EN/TH with dark+paper themes.

**Independent Test**: Load seeded site, scroll all sections, toggle EN↔TH and dark↔paper (both
persist), resize 360→1440, enable reduce-motion, run axe AA — all pass.

### Tests for User Story 1 (write first, must fail) ⚠️

- [X] T021 [P] [US1] E2E: all sections render in EN with seeded content in `tests/e2e/us1-sections.spec.ts`
- [X] T022 [P] [US1] E2E: language switch EN↔TH updates all prose and persists on return in `tests/e2e/us1-i18n.spec.ts`
- [X] T023 [P] [US1] E2E: theme toggle dark↔paper persists across reload in `tests/e2e/us1-theme.spec.ts`
- [X] T024 [P] [US1] E2E a11y: axe WCAG 2.1 AA on every section + states, both themes in `tests/e2e/us1-a11y.spec.ts`
- [X] T025 [P] [US1] E2E: reduce-motion disables decorative animation; marquee is pausable in `tests/e2e/us1-motion.spec.ts`
- [X] T026 [P] [US1] E2E: responsive 360–1440px no overflow/overlap/clipping (incl. +50% long text) in `tests/e2e/us1-responsive.spec.ts`
- [X] T027 [P] [US1] Unit: locale-scoped content mapping, single-locale fallback, empty-collection handling in `tests/unit/content.spec.ts`
- [X] T027a [P] [US1] E2E: the enumerated English-only labels stay untranslated across EN/TH while all prose toggles, and numeric/currency values render as authored per locale (FR-011, FR-011c) in `tests/e2e/us1-mono-labels.spec.ts`

### Implementation for User Story 1

- [X] T028 [US1] Content read layer (locale-scoped, published-only, ordered, fallback) via Payload Local API in `src/lib/content.ts` (content-api contract)
- [X] T029 [P] [US1] Primitive components Button, Pill, Reveal, Counter in `src/components/primitives/`
- [X] T030 [P] [US1] `LatticeCanvas` primitive (reduced-motion aware, `aria-hidden`) in `src/components/primitives/LatticeCanvas.tsx`
- [X] T031 [P] [US1] `CustomCursor` + magnetic buttons — disabled on touch/coarse-pointer and reduce-motion; never suppress focus (FR-007c) in `src/components/layout/CustomCursor.tsx`
- [X] T032 [P] [US1] Nav + `LangToggle` + `ThemeToggle` with accessible names/states (FR-007d) in `src/components/layout/`
- [X] T033 [P] [US1] Hero section (word-reveal, Thai typography per FR-004) in `src/components/sections/Hero.tsx`
- [X] T034 [P] [US1] Marquee section with accessible pause/stop control (FR-007b) in `src/components/sections/Marquee.tsx`
- [X] T035 [P] [US1] Stats section (animated counters, reduce-motion safe) in `src/components/sections/Stats.tsx`
- [X] T036 [P] [US1] Capabilities grid in `src/components/sections/Capabilities.tsx`
- [X] T037 [P] [US1] Platform Showcase with tab/tabpanel semantics, first surface default (FR-007d, FR-008) in `src/components/sections/Showcase.tsx`
- [X] T038 [P] [US1] Selected Work / case studies in `src/components/sections/Work.tsx`
- [X] T039 [P] [US1] Process (sticky, language-aware) in `src/components/sections/Process.tsx`
- [X] T040 [P] [US1] Testimonial in `src/components/sections/Testimonial.tsx`
- [X] T041 [P] [US1] CTA section + Footer in `src/components/sections/CTA.tsx` and `src/components/layout/Footer.tsx`
- [X] T042 [US1] Compose page (all sections + loading states FR-005a) in `src/app/(frontend)/[locale]/page.tsx` (depends on T028–T041)
- [X] T043 [US1] Per-locale SEO/social metadata (title, description, OG image) in locale layout (FR-011a)
- [X] T044 [US1] Heading order + landmark regions across the page (FR-007a)
- [X] T045 [US1] Graceful content-load failure + empty-section collapse (Edge Cases) in `src/lib/content.ts` + page

**Checkpoint**: Public site fully functional with seeded content — MVP deployable/demoable.

---

## Phase 4: User Story 2 - Content editor manages all content in both languages (Priority: P2)

**Goal**: Authenticated staff edit every section's EN/TH content + SEO, manage collections, preview,
publish (with completeness gate + conflict detection), all in an AA-accessible back office.

**Independent Test**: Sign in, edit hero EN+TH, preview, publish, see it live; add/remove/reorder a
collection item; publish with TH missing is blocked; concurrent stale save is warned.

### Tests for User Story 2 (write first, must fail) ⚠️

- [X] T046 [P] [US2] Integration: deny-by-default — unauthenticated admin/API access redirected in `tests/integration/us2-auth.spec.ts`
- [X] T047 [P] [US2] Integration: publish blocked when EN or TH missing, with field-identifying message in `tests/integration/us2-publish-gate.spec.ts`
- [X] T048 [P] [US2] Integration: optimistic-concurrency conflict on stale save in `tests/integration/us2-conflict.spec.ts`
- [X] T049 [P] [US2] Integration: stat numeric validation rejects non-number; URL validation in `tests/integration/us2-validation.spec.ts` (+ `tests/integration/us2-preview-route.spec.ts` for the FR-017 preview-route security gates)
- [X] T050 [P] [US2] E2E: edit hero EN+TH → publish → visible; draft/preview hidden from public in `tests/e2e/us2-edit-publish.spec.ts`
- [X] T051 [P] [US2] E2E: add/remove (with confirmation)/reorder a collection item in `tests/e2e/us2-collections.spec.ts` (delete via the doc-actions popup → `.confirmation-modal.delete-document`; passes against a production build)
- [X] T052 [P] [US2] E2E a11y: back-office editing UI meets WCAG 2.1 AA (keyboard + axe) in `tests/e2e/us2-admin-a11y.spec.ts` — axe gates against NEW violations beyond a documented Payload-3.85 upstream baseline (button-name/color-contrast/list/label, tracked as upstream tech-debt); keyboard reachability (incl. Lexical contenteditable) verified

### Implementation for User Story 2

- [X] T053 [US2] Payload auth + deny-by-default access control on all collections/globals/admin (FR-012, admin-auth contract) in `src/payload.config.ts` + `src/access/` (+ idempotent admin bootstrap in `src/seed/seed.ts`, prod-guarded)
- [X] T054 [US2] Auth-failure handling: non-revealing errors, lockout/rate-limit, session expiry (FR-021a) — Payload `Users.auth` (maxLoginAttempts/lockTime/tokenExpiration) + Payload's non-revealing default sign-in errors
- [X] T055 [US2] Wire publish-completeness gate UX with clear messages (FR-014) using the T015 hook — **also fixed a real gate bypass: globals back-filled a blank locale via fallback; the gate now reads `fallbackLocale:'none'`**
- [X] T056 [US2] Draft + live preview reflecting drafts, hidden from public (FR-017, FR-018) in `src/app/api/preview/route.ts` (HMAC-signed token + session check) + draft read in `src/lib/content.ts` + `draftMode()` in the page
- [X] T057 [US2] Optimistic-concurrency conflict detection + warning + load-latest/re-apply flow, no silent discard (FR-020a) in `src/lib/concurrency.ts`
- [X] T058 [US2] Per-type content validation + actionable messages (stats numeric, links valid) (FR-019) in `src/lib/validation/url.ts` (honors `required`)
- [X] T059 [US2] Collection management UX: explicit ordering control + delete confirmation (FR-015) — `orderField` + Payload's built-in delete-confirm modal (e2e proof T051 pending)
- [X] T060 [US2] SEO metadata editing in CMS (EN/TH + OG image upload) (FR-015a) — `SEOMetadata` global (localized title/description + `ogImage` → Media)
- [X] T061 [US2] Audit trail (who/when) on published changes via Payload versions (FR-020) — `versions:{drafts:true}` on all content collections/globals
- [X] T062 [US2] On-publish visibility so published content appears immediately (FR-016): the public `/[locale]` page renders dynamically (`force-dynamic`, in-process Payload reads) so a publish is visible at once; `src/lib/revalidate.ts` afterChange/afterDelete hooks (`revalidatePath('/[locale]','layout')`, failure-logged) remain as defense-in-depth for a future CDN/ISR layer
- [X] T063 [US2] CSRF + injection + XSS output-encoding protections on back-office operations (FR-021) — Payload CSRF allow-list + Drizzle parameterized queries + React output-encoding + safe preview redirect (no open-redirect, HMAC token)

**Checkpoint**: Non-technical staff can fully manage the site; US1 + US2 work independently.

---

## Phase 5: User Story 3 - Prospect submits an inquiry (Priority: P3)

**Goal**: PDPA-compliant on-site inquiry capture with consent, spam protection, studio email
(failure-isolated), back-office inbox, and 24-month auto-deletion.

**Independent Test**: Submit with consent → confirmation; appears in inbox with locale/time; missing
consent blocked; simulated email failure doesn't lose the record; back-dated record auto-deleted.

### Tests for User Story 3 (write first, must fail) ⚠️

- [X] T064 [P] [US3] Contract: `POST /api/inquiries` valid → 201 + localized confirmation in `tests/integration/us3-inquiry-create.spec.ts`
- [X] T065 [P] [US3] Contract: 400 field errors; consent required; honeypot/rate-limit → 429 in `tests/integration/us3-inquiry-validation.spec.ts`
- [X] T066 [P] [US3] Integration: email send failure does NOT lose/roll back stored inquiry (FR-029) in `tests/integration/us3-email-isolation.spec.ts`
- [X] T067 [P] [US3] Integration: retention job permanently deletes >24mo records; monitored failure alerts/catches up (FR-027/FR-027a) in `tests/integration/us3-retention.spec.ts`
- [X] T068 [P] [US3] E2E: submit with consent → confirmation; appears in inbox with locale + time in `tests/e2e/us3-inquiry.spec.ts`
- [X] T069 [P] [US3] E2E a11y: inquiry-form errors programmatically associated + announced (FR-007d) in `tests/e2e/us3-form-a11y.spec.ts`

### Implementation for User Story 3

- [X] T070 [US3] `Inquiries` collection (consent, consentAt, submittedAt, expiresAt, status; create=public, read/update/delete=staff) in `src/collections/Inquiries.ts` — create=`denyAll` (public create only via the validated route w/ `overrideAccess`); no drafts/versions (PDPA permanent-delete); `submittedAt`=Payload `createdAt`; `expiresAt`/`status` indexed
- [X] T071 [P] [US3] Inquiry validation schema (Zod) in `src/lib/validation/inquiry.ts` — localized field errors (FR-023) + route response copy
- [X] T072 [US3] `POST /api/inquiries` route: validate, spam (challenge + honeypot + rate-limit 5/IP/hr), persist, set `expiresAt = +24mo` (inquiry-api contract) in `src/app/api/inquiries/route.ts` (+ `src/lib/rateLimit.ts`, `src/lib/turnstile.ts` fail-closed)
- [X] T073 [US3] Inquiry form UI: consent checkbox + privacy-notice link, localized errors, loading state (FR-026, FR-005a, FR-007d) in `src/components/sections/InquiryForm.tsx` — replaces the design's `mailto:` in `CTA.tsx`; + bilingual privacy page `src/app/(frontend)/[locale]/privacy/page.tsx`
- [X] T074 [US3] Email notification on create — best-effort, failure-isolated, logged (FR-029) in `src/lib/email.ts` (pure builder HTML-escapes + strips CR/LF; wired as Inquiries `afterChange`)
- [X] T075 [US3] Back-office inbox (name/email/message/locale/time/status) + delete-on-request (FR-024, FR-028) — `Inquiries` admin group "Inbox", `-createdAt` sort, readOnly submitted fields, built-in delete
- [X] T076 [US3] Retention job: daily, permanently delete >24mo, monitored + alert + catch-up (FR-027/FR-027a) in `src/lib/retention.ts` + runnable entry `src/jobs/retention.ts` (`pnpm retention`)
- [X] T077 [US3] In-region (Singapore) storage/processing config + enforce TLS (FR-030) — conditional S3 media storage (`ap-southeast-1`) in `payload.config.ts`; HSTS + security headers in `next.config.mjs`; inquiries reside in the Singapore Postgres via `DATABASE_URI`
- [X] T078 [US3] Cookieless analytics: pageviews + `inquiry_submitted` conversion, no cookie banner (FR-011b) in `src/lib/analytics.ts` + `src/components/layout/Analytics.tsx` (injected only when configured) + conversion emit in the form

**Checkpoint**: All three stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T079 [P] Lighthouse CI budget gate (LCP<2.5s, INP<200ms, CLS<0.1, JS≤200KB) wired in CI — `lighthouserc.json` asserts LCP≤2500, CLS≤0.1, TBT≤200 (INP lab proxy), and **`resource-summary:script:size` ≤ 204800 bytes (200KB)**; run by the `lighthouse` CI job
- [X] T080 [P] Full WCAG 2.1 AA manual keyboard + screen-reader pass (public + back office, both themes) per quickstart.md — automated axe across all states + NEW public keyboard-nav e2e (`tests/e2e/us1-keyboard.spec.ts`); manual pass recorded in `docs/accessibility.md`
- [X] T081 [P] Dependency vulnerability scan gate (no high/critical) + no-secrets-in-source check in CI — `security` job: `pnpm audit --audit-level high` (verified: 0 high/critical) + gitleaks-action
- [X] T082 [P] Coverage gate ≥ 80% on business-logic modules (`src/lib/**`, hooks, access, retention, email) in CI — `test` job runs `pnpm test:ci` (vitest v8 thresholds 80); current 90.99/80.6/95.23/90.99
- [X] T083 [P] Documentation: README, handover docs, finalize `.env.example` — `README.md`, `docs/handover.md` (ops runbook), `docs/accessibility.md`; `.env.example` already enumerates all vars
- [X] T084 Run quickstart.md verification flows (US1/US2/US3) end to end — 184 unit/integration + full e2e (US1 sections/i18n/theme/a11y/motion/responsive/longtext/keyboard, US2 edit-publish/collections/admin-a11y, US3 inquiry/form-a11y) green; lint clean; build ok
- [X] T085 [P] Long-text (+50%) layout-integrity checks across all sections (Edge Cases) — `tests/e2e/us1-longtext.spec.ts` inflates prose +50% and asserts no horizontal overflow at 360/1440px, EN+TH

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: no dependencies.
- **Foundational (P2)**: depends on Setup — BLOCKS all user stories.
- **User Stories (P3–P5)**: all depend on Foundational. After that:
  - US1 (P1) is the MVP and has no dependency on US2/US3.
  - US2 (P2) depends on Foundational; consumes US1's content read/preview surfaces but is testable independently.
  - US3 (P3) depends on Foundational; independent of US1/US2.
- **Polish (P6)**: depends on the targeted user stories being complete.

### Within Each User Story

- Tests are written FIRST and must FAIL before implementation (Constitution II).
- Schema/data (Foundational) → content/services → components → page composition → cross-cutting (a11y/SEO).

### Parallel Opportunities

- All Setup `[P]` tasks (T003–T007) run in parallel.
- Foundational `[P]` tasks (T011–T014, T016) run in parallel after T009/T010.
- All test tasks within a story (`[P]`) run in parallel and before that story's implementation.
- US1 section/primitive components (T029–T041) are largely `[P]` (different files); T042 joins them.
- Once Foundational is done, US1 / US2 / US3 can be staffed in parallel.

---

## Parallel Example: User Story 1 tests

```bash
# Author these together (all must fail first):
T021 us1-sections.spec.ts   T022 us1-i18n.spec.ts     T023 us1-theme.spec.ts
T024 us1-a11y.spec.ts       T025 us1-motion.spec.ts   T026 us1-responsive.spec.ts
T027 content.spec.ts (unit)
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1.
2. **STOP & VALIDATE**: bilingual public site with seeded content, both themes, AA, responsive.
3. Deploy/demo as MVP.

### Incremental Delivery

- Add US2 (CMS) → staff can maintain content → demo.
- Add US3 (inquiries + PDPA) → lead capture → demo.
- Each story is an independently testable, deployable increment.

---

## Notes

- `[P]` = different files, no incomplete dependencies.
- Verify each story's tests FAIL before implementing (Constitution Principle II).
- Commit after each task or logical group.
- Gates (Constitution): tests pass + coverage ≥ 80%; WCAG 2.1 AA (public + back office, both themes);
  Lighthouse budgets; both EN+TH before publish; dependency scan clean; PDPA residency + retention.
