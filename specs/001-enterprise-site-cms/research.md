# Phase 0 Research: Wrenfield Works Enterprise Site + CMS

All Technical Context unknowns are resolved below. Each item records the Decision, Rationale, and
Alternatives considered.

## 1. CMS architecture — Payload CMS embedded in Next.js

- **Decision**: Use Payload CMS 3.x mounted inside a single Next.js 16 App Router project (admin UI
  under a `(payload)` route group; public site under `(frontend)`). Read content server-side via
  Payload's Local API (no network hop) during rendering.
- **Rationale**: One deployable, one language (TypeScript) end to end, no separate CMS service to
  secure or sync. Payload ships admin UI, authentication, access control, field-level localization,
  drafts/versions, and REST + GraphQL + Local API out of the box — directly covering FR-012 through
  FR-020a. Local API reads keep public-page rendering fast (Performance Goals).
- **Alternatives considered**: Separate headless CMS (Strapi/Directus) + standalone frontend —
  rejected for the extra service, cross-service auth, and network latency on every content read.
  WordPress — rejected: bespoke canvas/variable-font/scroll design would fight a theme and i18n
  needs plugins.

## 2. Data store — PostgreSQL via Payload Postgres adapter

- **Decision**: PostgreSQL 16 (managed, Singapore region) using `@payloadcms/db-postgres`
  (Drizzle-based).
- **Rationale**: Relational integrity for ordered collections (capabilities, case studies, process
  steps), strong support for the localization and versions tables Payload generates, mature managed
  options in `ap-southeast-1` for PDPA data residency.
- **Alternatives considered**: MongoDB adapter — rejected; relational ordering/uniqueness and
  regional managed Postgres better fit the data and compliance needs.

## 3. Bilingual content (EN/TH) + publish completeness

- **Decision**: Enable Payload localization with locales `en` (default) and `th`; mark every
  human-readable field `localized: true`. Enforce "both languages present before publish" with a
  `beforeChange`/`beforeValidate` hook that blocks the published status when either locale value is
  empty (FR-014). Technical/monospace labels (section numbers, category tags) are non-localized by
  design (FR-011).
- **Rationale**: Native, field-level localization avoids a hand-rolled translation table; the hook
  turns the i18n principle into an enforced gate, not a guideline.
- **Alternatives considered**: Separate per-locale documents — rejected (duplicates structure,
  risks drift). Frontend-only i18n dictionary (like the prototype's `i18n.js`) — rejected; content
  must be editable in the CMS, not in code (FR-009).
- **Next.js 16 routing note**: locale segments (`/en`, `/th`) and default-locale redirect use the
  v16 `proxy.ts` file (renamed from `middleware.ts`; export `proxy`, Node runtime only). If a
  helper library (e.g., next-intl) is added for routing, pin a version compatible with the v16
  `proxy` convention; otherwise hand-roll the lightweight locale redirect in `proxy.ts`.

## 4. Drafts, preview, versions & optimistic concurrency

- **Decision**: Enable Payload drafts + versions on all content collections/globals. Use draft
  preview for FR-018. Rely on Payload's document version/`updatedAt` to detect a stale write and
  reject the conflicting save with a clear message (FR-020a, optimistic concurrency).
- **Rationale**: Versions give the audit trail (FR-020) and the conflict-detection token in one
  mechanism; immediate publish (per clarification) is the default publish action.
- **Alternatives considered**: Pessimistic locking — rejected per clarification (lock contention,
  stale locks). Scheduled publishing / rollback UI — explicitly out of scope this release.

## 5. Cookieless analytics

- **Decision**: Self-hosted **Plausible** (or Umami) in the Singapore region; no cookies, no
  personal identifiers, so no consent banner (FR-011b). Track page views and the inquiry-submitted
  conversion event.
- **Rationale**: Privacy-friendly by design, aligns with the PDPA stance, lightweight script with
  negligible performance impact, gives the aggregate traffic/conversion numbers marketing needs.
- **Alternatives considered**: Google Analytics — rejected; cookie-based, would force a consent
  banner and conflict with the chosen no-banner UX. No analytics — rejected; loses ROI visibility.

## 6. Inquiry email notification + failure isolation

- **Decision**: On inquiry create, a Payload `afterChange` hook enqueues/sends an email to the
  studio via a transactional provider (React Email templates). The send is wrapped so any failure is
  logged (Pino) and retried out-of-band but **never** rolls back or loses the stored inquiry
  (FR-029). The on-page visitor confirmation (FR-022) does not depend on the email succeeding.
- **Rationale**: Satisfies "notify studio + inbox" while honoring Constitution V (no silent failure,
  failure isolation). The stored record is the source of truth; email is best-effort delivery.
- **Alternatives considered**: Send email synchronously in the request path — rejected; a provider
  outage would fail or delay the visitor's submission.

## 7. Spam / abuse protection

- **Decision**: Cloudflare Turnstile (privacy-friendly, no personal tracking) plus a server-side
  honeypot field and per-IP rate limiting on the inquiry endpoint (FR-025).
- **Rationale**: Layered defense without cookies or invasive tracking; consistent with the
  cookieless/PDPA posture.
- **Alternatives considered**: reCAPTCHA — rejected (cookies/tracking). Honeypot alone — insufficient
  against modern bots.

## 8. PDPA retention (24 months) enforcement

- **Decision**: A scheduled job (cron, in-region) runs daily, permanently deleting inquiries whose
  submission timestamp is older than 24 months (FR-027). The job is monitored — a failed run alerts
  and catches up on the next run (FR-027a). Each inquiry stores `consent` (+ timestamp) and a derived
  `expiresAt`. Staff can manually delete an individual's data on request (FR-028).
- **Rationale**: Automatic, auditable enforcement makes SC-010 testable; `expiresAt` makes the job a
  simple, indexable query.
- **Alternatives considered**: Manual periodic cleanup — rejected (not reliable/auditable). DB TTL —
  Postgres has no native TTL; an application job is the portable choice.

## 9. Reproducing the bespoke design in React (fidelity)

- **Decision**: Port `enterprise.css` tokens verbatim into a single token source (CSS variables +
  Tailwind theme). Re-implement behavior as small client components: `LatticeCanvas` (the generative
  node/line field), `CustomCursor`, magnetic buttons, scroll-reveal (IntersectionObserver), animated
  counters, showcase tabs, sticky process. All animation respects `prefers-reduced-motion` (a global
  `motion-off` switch), per FR-006.
- **Rationale**: Tokens-first guarantees pixel fidelity and satisfies Principle VI (single source of
  truth, no ad-hoc styles). Isolating canvas/cursor as client components keeps the rest
  server-rendered for SEO/perf.
- **Alternatives considered**: Copying the prototype's vanilla JS wholesale — rejected; the README
  says match visual output, not internal structure, and componentizing enables reuse + testing.

## 10. Accessibility (WCAG 2.1 AA) approach

- **Decision**: `@axe-core/playwright` automated AA checks in CI on every section + states, plus a
  manual keyboard and screen-reader pass before release. Decorative canvas marked `aria-hidden`;
  language toggle and tabs given proper roles/labels; visible focus styles in tokens.
- **Rationale**: Combines broad automated coverage with the manual checks automation can't do
  (focus order, SR semantics), satisfying FR-007 / SC-004.
- **Alternatives considered**: Automated-only — rejected; misses focus order and SR experience.

## 11. Performance budget enforcement

- **Decision**: Lighthouse CI in the pipeline asserting the Performance Goals (LCP/INP/CLS, JS size).
  Public page rendered static/ISR and served via CDN; variable fonts with `font-display: swap`.
- **Rationale**: Makes the Constitution V performance gate automated and non-negotiable, not a
  one-time check.
- **Alternatives considered**: Manual Lighthouse runs — rejected; not enforceable per change.

## 12. Hosting & data residency

- **Decision**: App (Next.js + Payload), Postgres, object storage, analytics all in an Asia-Pacific
  Singapore region (`ap-southeast-1`). TLS enforced end to end; secrets in environment/secret store.
- **Rationale**: Low latency for Thai users and PDPA data residency for inquiry personal data.
- **Alternatives considered**: US/EU default regions — rejected for latency and data-residency.

## Resolved unknowns

No `NEEDS CLARIFICATION` markers remain. Observability (Pino structured logging + analytics + CI
Lighthouse) and hosting/tech constraints — previously deferred from `/speckit-clarify` — are decided
above.
