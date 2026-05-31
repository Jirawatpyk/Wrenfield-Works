# Design — Admin UI: Branding, Editor Guidance & Editorial Theme

- **Date:** 2026-05-31
- **Feature branch:** `001-enterprise-site-cms`
- **Status:** Approved (design) → next: implementation plan
- **Scope tag:** Admin (`/admin`) back-office UI only. No changes to US1 (public site) or US2 (CMS write/validation logic).

> สรุปไทย: ปรับหน้า `/admin` ให้มีแบรนด์ Wrenfield Works เต็มตัว (A), ช่วย editor ไทยทำงานง่ายขึ้น (C),
> และทำธีมหลังบ้านแบบ editorial ให้ดูมือโปร (D) — โดยไม่แตะ logic ของ US1/US2 ที่ build เสร็จแล้ว
> ทุกอย่างเคารพ WCAG 2.1 AA ทั้งธีมมืด/สว่าง (FR-007), ทุกข้อความมี EN+TH, token-driven, และ TDD.

---

## 1. Goals & Non-Goals

### Goals
1. **A — Branding.** Replace the default Payload identity on the login screen and nav with the
   Wrenfield Works mark + wordmark, plus a branded favicon and document title.
2. **C — Editor guidance.** Help non-technical Thai editors: a dashboard welcome card, an EN/TH
   publish-readiness indicator, and per-field help text — all bilingual (EN/TH).
3. **D — Editorial theme.** A full token-driven restyle of the admin (brass accent, ink surfaces,
   Fraunces headings, styled controls), dark by default but switchable, AA-compliant in both themes.

### Non-Goals (YAGNI)
- No new full-page custom admin views, no drag-and-drop page builder.
- No changes to the rich-text editor, collections/globals data model, or US1/US2 behavior.
- No changes to access control, the publish gate, conflict detection, or revalidation logic
  (we **reuse** the publish-completeness logic, we do not alter its behavior).

---

## 2. Binding constraints (Constitution / spec)

| Gate | Requirement | How this design meets it |
|------|-------------|--------------------------|
| **UI** | token-driven, reusable | All admin styling maps Payload theme variables → existing brand tokens; mark is one reusable component. |
| **i18n** | every user-facing string has EN **and** TH | Custom copy lives in a bilingual namespace; field descriptions use `{ en, th }`; a test fails if any key is missing a locale. |
| **UX / FR-007** | WCAG 2.1 AA on the **back-office** UI, both themes | Theme overrides keep contrast ≥ 4.5:1 (≥ 3:1 large); Playwright + axe gate on login + dashboard in dark **and** light. |
| **TDD** (non-negotiable) | tests written before implementation | Pure logic (`completeness`, `adminCopy`, `localeFields`) is unit-tested first; e2e written before wiring. |
| **Code Quality** | lint/format/type pass, ≥80% coverage on business-logic modules | New logic in `src/lib/**` is pure and unit-tested; components stay thin. |
| **Security** | deny-by-default; no new external input | No new write paths or inputs; admin remains auth-gated. Favicon is a static asset. |

---

## 3. Decisions (locked during brainstorming)

| # | Decision | Choice |
|---|----------|--------|
| A | Logo rendering | **React component**, theme-aware (brass on dark / ink on light), wordmark in Fraunces. |
| C | Guidance scope | **All three**: welcome card + EN/TH status indicator + per-field descriptions. |
| C | Guidance language | **Bilingual EN/TH**, switched by the editor's chosen admin language. |
| D | Theme depth | **Full editorial restyle.** |
| D | Default theme | **Dark by default, switchable.** |

---

## 4. Detailed design

### 4.1 A — Branding

**Source assets** (already in repo): `docs/Frist Pilot-handoff/frist-pilot/project/assets/`
`mark-brass.svg`, `mark-ink.svg`, `favicon.svg`, `lockup-on-dark.svg`. The mark is a 5-node
"lattice peak" (points `24,34 38,66 50,44 62,66 76,34`, center node ringed).

**Components** (`src/components/admin/`):

- **`BrandIcon.tsx`** — inline SVG of the mark using `currentColor` for strokes/fills, so a single
  component recolors itself via CSS per theme (no two-file swap). Registered at
  `admin.components.graphics.Icon`. Includes an accessible `role="img"` + `aria-label`.
- **`BrandLogo.tsx`** — the lockup: `BrandIcon` + the wordmark. "Wrenfield" in `--theme-text`,
  "Works" in the brass accent, rendered as live text in `var(--font-serif)` (Fraunces) — crisp at
  any size and theme-adaptive. Registered at `admin.components.graphics.Logo`.

**Static + meta** (`src/payload.config.ts` → `admin.meta`):
- Copy `favicon.svg` to `public/favicon.svg`; reference via `admin.meta.icons`.
- `titleSuffix: '— Wrenfield Works'`, plus `description` and `openGraph` defaults.

**Accessibility:** mark carries a text alternative; the wordmark is real text (not an image), so it
is selectable and screen-reader friendly. Brass-on-surface and text-on-surface pairs verified ≥ AA.

### 4.2 C — Editor guidance

**(a) Welcome card** — `WelcomeCard.tsx` at `admin.components.beforeDashboard`.
Greets the editor, states what the CMS lets them change, and emphasizes the key rule
**"both EN and TH are required before Publish"** (mirrors FR-014), with a contact pointer.
Bilingual via the custom translation namespace (renders in the active admin language).

**(b) EN/TH completeness indicator** — two surfaces sharing one pure logic:

- **`PublishReadiness.tsx`** (server component) at `admin.components.beforeDashboard` (below the
  welcome card). For each content global/collection it reads `locale: 'all'` with
  `fallbackLocale: 'none'`, `draft: true`, then computes per-locale status. Renders a compact table:
  per type → `EN ✓/✗ · TH ✓/✗ · published/draft`. One place to see the whole site's readiness.
- **`LocaleStatusField.tsx`** — a `type: 'ui'` field placed at the top of each content type's edit
  view, **server-rendered**, showing that document's EN/TH status **as of the last save**
  (with a hint: "save a draft to refresh"). Server-rendering avoids the client-form-state limitation
  (the edit form only holds the active locale, so a live cross-locale check isn't possible there).

**(c) Field descriptions** — add `admin.description` as `{ en, th }` objects to fields across the
content collections/globals (what the field is, where it appears, image-size hints, etc.).

**Bilingual strategy:** enable Payload admin i18n Thai
(`i18n.supportedLanguages: { en, th }`, `fallbackLanguage: 'en'`) and register a custom translation
namespace (`adminCopy`) for our strings. This makes the back-office chrome **and** our guidance
switch with the editor's chosen admin language. Note: this intentionally pulls in Thai admin chrome
(a slice of the earlier "Thai back office" option) because bilingual switching requires Thai to exist
in Payload i18n. Field labels/descriptions as `{ en, th }` resolve against this same language.

### 4.3 D — Editorial theme

All in `src/app/(payload)/custom.scss` (already imported by `(payload)/layout.tsx`).

- **Variable overrides only.** Override Payload theme custom properties — `--theme-bg`,
  `--theme-text`, `--theme-elevation-0…1000`, accent/`--theme-success`/`--theme-error`/`--theme-warning`
  — scoped under `[data-theme="dark"]` and `[data-theme="light"]`, mapped to brand tones
  (ink / brass / paper). **Never** target Payload's internal class names → survives Payload upgrades.
- **Fonts.** Apply Fraunces to headings via the existing `next/font` variables. In
  `(payload)/layout.tsx`, wrap `{children}` in a `display:contents` element carrying
  `fontVariables` (from `src/lib/fonts.ts`); `custom.scss` then uses `var(--font-serif)` for headings
  and the brand sans for body. (See Risks for the coverage fallback.)
- **Controls.** Buttons/inputs get brass borders/focus rings and brand radii, keeping visible focus
  states (AA focus-visible).
- **Default dark, switchable.** Set `admin.theme: 'all'` (keeps Payload's theme switcher), plus a
  small client provider at `admin.components.providers` (`DefaultDarkTheme.tsx`) that selects dark on
  first visit when the editor has no stored preference.
- **AA both themes.** Every overridden pair is chosen for ≥ 4.5:1 (normal) / ≥ 3:1 (large), the same
  discipline `src/styles/tokens.css` already applies to the public paper theme.

---

## 5. Module / file structure

```
src/components/admin/
  BrandLogo.tsx            # graphics.Logo  (mark + wordmark, Fraunces, theme-aware)
  BrandIcon.tsx            # graphics.Icon  (mark, currentColor)
  WelcomeCard.tsx          # beforeDashboard (bilingual greeting + publish rule)
  PublishReadiness.tsx     # beforeDashboard (server: per-type EN/TH readiness table)
  LocaleStatusField.tsx    # ui field (server: this doc's EN/TH status as of last save)
  DefaultDarkTheme.tsx     # providers (default to dark when no stored preference)

src/lib/validation/localeFields.ts   # extracted shared: isBlank + localized-leaf walk
src/lib/admin/completeness.ts        # per-locale status (reuses localeFields)
src/lib/admin/adminCopy.ts           # bilingual EN/TH custom i18n strings

src/app/(payload)/custom.scss        # editorial theme (variable overrides)
src/app/(payload)/layout.tsx         # wrap children with fontVariables
public/favicon.svg                   # brand favicon (copied from handoff)
src/payload.config.ts                # wire admin.components / meta / theme / i18n(th)
```

**Targeted refactor (improves boundaries):** promote `isBlank` and the localized-leaf walk out of
`src/lib/validation/publishCompleteness.ts` into `src/lib/validation/localeFields.ts`, consumed by
**both** the publish gate and the new `completeness.ts`. This guarantees the badge and the gate agree
on "what counts as complete." `publishCompleteness.ts` keeps its public behavior and its `__test`
export; its existing tests must continue to pass unchanged (regression guard).

---

## 6. Data flow

- **Branding/theme:** static — components + CSS variables resolved at render; no data access.
- **Welcome card:** static bilingual copy via `t()` (active admin language).
- **Dashboard readiness:** server component → Payload Local API (`findGlobal`/`find`,
  `locale: 'all'`, `fallbackLocale: 'none'`, `draft: true`, `depth: 0`, `overrideAccess` per request
  auth) → `completeness.collectLocaleStatus(fields, doc)` → `{ enMissing[], thMissing[] }` → table.
- **Inline status field:** same pure function over the doc's last-saved `locale:'all'` snapshot.
- **Publish gate (unchanged):** still the authority that blocks publishing; the indicator only
  *previews* the same verdict.

---

## 7. Testing strategy (TDD — write first)

### Unit (Vitest)
- `completeness.collectLocaleStatus`: EN-only, TH-only, both-complete, both-empty, nested
  array/blocks, non-localized fields ignored → correct `{ enMissing, thMissing }`.
- `adminCopy`: every key has both `en` and `th` (loops keys; fails on any missing locale).
- `localeFields` refactor: re-run the **existing** `publishCompleteness` unit suite unchanged → green
  (proves the extraction didn't change gate behavior).

### Integration
- `payload.config` builds with the new `admin.components`, `meta`, `theme`, and `i18n` (th).
- `importMap` resolves every registered component path.

### E2E (Playwright + @axe-core/playwright)
- Login page: `BrandLogo` visible; axe AA passes in **dark** and **light**.
- Dashboard: welcome card + readiness panel render; bilingual switch works; axe AA passes both themes.
- Theme toggle round-trip stays AA. → closes **FR-007** for these screens.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Font variable doesn't reach admin chrome rendered outside `{children}` | Primary: `display:contents` wrapper with `fontVariables`. Fallback: declare `@font-face` for Fraunces in `custom.scss` (self-hosted woff2) so headings get the face regardless of where the variable is scoped. |
| Payload upgrade changes theme variable names | We override documented theme variables only; pin Payload `3.85.0`; e2e AA test catches regressions on upgrade. |
| Enabling Thai admin i18n shifts back-office chrome to Thai unexpectedly | `fallbackLanguage: 'en'`; editors pick language in account settings; documented as intended behavior. |
| Inline status reflects only last save (not live typing) | Explicit hint text; the dashboard panel + the real publish gate remain authoritative. |
| Restyle hides a control's focus state | AA focus-visible rules added explicitly; e2e axe + manual keyboard pass. |

---

## 9. Out of scope / future
Custom dashboard analytics widgets, list-view per-row locale cells, admin onboarding tour, and
email/notification styling (US3) are deliberately deferred.
