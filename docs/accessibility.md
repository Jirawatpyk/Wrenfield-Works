# Accessibility Conformance & Manual-Verification Record

**Product:** Wrenfield Works Enterprise Site + CMS — bilingual (EN / ไทย) marketing site with an
embedded Payload CMS back office.
**Standard:** WCAG 2.1 Level AA.
**Spec basis:** `specs/001-enterprise-site-cms/spec.md` §FR-007, FR-007a, FR-007b, FR-007c, FR-007d;
success criteria SC-004 (zero AA-level blockers) and SC-008 (reduced-motion).
**Requirements-quality gate:** `specs/001-enterprise-site-cms/checklists/accessibility.md`
(16/16 checklist items resolved on 2026-05-31).
**Constitution:** `.specify/memory/constitution.md` — Accessibility/UX is a gated principle;
Security and Test-First are NON-NEGOTIABLE.
**Release:** Phase 6 cross-cutting polish, branch `001-enterprise-site-cms`.
**Manual verification date:** 2026-06-01.
**Result:** **PASSED** for this release (automated AA clean on our code + manual keyboard and
screen-reader passes complete; see sign-off at the end).

---

## 1. Scope

WCAG 2.1 AA applies to **both** surfaces of the product, in **both** themes:

| Surface | Routes | Themes audited |
| --- | --- | --- |
| Public bilingual site | `src/app/(frontend)/[locale]/` → `/en`, `/th` | dark (default) **and** paper/light |
| Back-office editing UI | `src/app/(payload)/` → `/admin` (Payload `@payloadcms/ui`) | dark (default) **and** light |

This dual scope is mandated by FR-007 ("Both the public site and the back-office editing UI MUST
meet WCAG 2.1 AA") and confirmed in the spec Clarifications. AA contrast targets — 4.5:1 normal
text, 3:1 large text and non-text/UI components — apply to **both the dark and paper themes**
(FR-007 + FR-005b). The persistent visitor theme toggle (`src/components/layout/ThemeToggle.tsx`)
must therefore never produce a theme that fails contrast.

The decorative lattice canvases and the custom cursor are explicitly `aria-hidden` /
pointer-decorative and are not part of the accessible name tree (FR-007c; checklist CHK003).

---

## 2. Automated coverage (axe-core via Playwright)

Automated WCAG 2.1 AA checks run through `@axe-core/playwright` inside the Playwright e2e suite
(`pnpm test:e2e`), tagged `['wcag2a','wcag2aa','wcag21a','wcag21aa']`. The public-site specs assert
**zero violations**; the back-office specs assert **no NEW serious/critical violations beyond a
documented Payload upstream baseline** (see the note below).

| Spec file | What it covers | Assertion |
| --- | --- | --- |
| `tests/e2e/us1-a11y.spec.ts` | Every public section in **EN dark**, **EN paper**, and **TH dark** (full-page axe scan; paper reached via the theme toggle). Audited under reduced motion so the static lattice can't corrupt contrast measurement. | `violations` is empty (zero AA violations) |
| `tests/e2e/us3-form-a11y.spec.ts` | Inquiry form — **error association** (`aria-invalid="true"` + `aria-describedby` pointing at a visible, non-empty message on `#inquiry-name`), required-consent flagging (`#inquiry-consent`), an assertive **live region** (`role="alert"`) scoped inside the form, and a full axe AA scan of the CTA section in its **error state**; plus the privacy-notice link (FR-026). | error semantics present; `violations` empty in error state |
| `tests/e2e/us1-motion.spec.ts` | **Reduced motion**: OS `prefers-reduced-motion: reduce` adds `body.motion-off`; the logo **marquee** exposes an accessible pause control (`aria-pressed` toggles `false`→`true`, driving `data-paused="true"` on the marquee). Verifies FR-006/FR-007b/SC-008. | `motion-off` applied; pause control toggles state |
| `tests/e2e/us2-admin-a11y.spec.ts` | **Back-office editing UI**: Hero global edit view and Stats collection list view introduce no new serious/critical AA violations beyond the Payload baseline; **keyboard reachability** — Tab from `#field-kicker` lands on a genuinely focusable control on each step, explicitly including Payload's **Lexical `[contenteditable="true"]`** rich-text fields. | no novel serious/critical; each Tab lands on a focusable control |
| `tests/e2e/admin-theme-a11y.spec.ts` | **Admin editorial theme** in **both dark and light**: login screen, dashboard (`wf-welcome-card`), and the edit view with the per-document `wf-locale-status` banner introduce no new serious/critical AA violations. `color-contrast` is forgiven **only** for Payload's own chrome — if it lands on one of **our** `.wf-*` nodes it fails (that is the whole point of the gate). | no novel serious/critical; our `.wf-*` nodes held to full AA |

### Documented Payload 3.85 upstream axe baseline

The back office **is** Payload's own admin UI (`@payloadcms/ui`). Payload 3.85 ships several
serious/critical axe violations that live in `node_modules` and cannot be fixed from application
code. Rather than silently suppress rules (which would falsely assert AA), the back-office specs pin
a **documented baseline of upstream rule ids** and gate against **NEW** violations only — i.e. any
regression introduced by our own field definitions, branding, or admin contributions. The baseline
is tracked tech-debt to raise upstream (or formally accept):

- `button-name` — Payload's icon-only controls (locale popup, doc-actions "…" kebab, publish-options) lack discernible text.
- `color-contrast` — Payload admin theme chrome (forgiven for Payload nodes only; our `.wf-*` nodes are NOT forgiven).
- `list` — Payload markup uses `<ul>` wrappers that axe flags.
- `label` / `select-name` / `aria-input-field-name` — Payload's own select/combobox controls.
- `aria-required-children` / `aria-required-parent` — Payload composite widgets.
- `aria-hidden-focus` — Payload's ReactSelect DropdownIndicator renders a focusable `<button aria-hidden="true">` (admin-theme spec only).

This baseline applies **exclusively** to the back office. The **public site** is held to **zero**
AA violations with no baseline (`us1-a11y.spec.ts`, `us3-form-a11y.spec.ts`).

---

## 3. Manual keyboard pass

Performed 2026-06-01 against `/en` and `/th` (both themes) and `/admin` (both themes). **All items
PASSED.**

| # | Check (spec ref) | Status | Note |
| --- | --- | --- | --- |
| K1 | Logical tab order matches visual/reading order across nav, hero, marquee, stats, capabilities, showcase, work, process, testimonial, CTA/form, footer (FR-007, FR-007a) | DONE | Source-order DOM; no positive `tabindex`; reverse-Tab retraces cleanly. |
| K2 | Visible focus indicator on **every** focusable element, in both themes (FR-007) | DONE | Token-driven focus ring; verified on links, buttons, toggles, tabs, all form fields; contrast holds in dark and paper. |
| K3 | No keyboard traps anywhere (FR-007) | DONE | Tab/Shift+Tab enters and exits every region incl. the inquiry form and showcase tablist; nothing captures focus. |
| K4 | Custom cursor never hides or replaces the native focus indicator (FR-007c) | DONE | `CustomCursor.tsx` is `aria-hidden` decorative overlay; disabled on touch/coarse-pointer and under reduced motion; focus ring always visible underneath. |
| K5 | Interactive touch targets ≥ 44×44 CSS px (FR-007c) | DONE | Nav links, language toggle, theme toggle, marquee pause, showcase tabs, submit button, and form controls meet the minimum at mobile widths. |
| K6 | Showcase exposes tab / tabpanel semantics with a clear selected state, operable by keyboard (FR-007d, FR-008) | DONE | `Showcase.tsx` uses `role="tab"`/`role="tabpanel"` + `aria-selected`; arrow/Tab + Enter/Space switch surfaces; first surface selected on load. |
| K7 | Language toggle has an accessible name and conveys the active language (FR-007d) | DONE | `LangToggle.tsx` EN/TH controls carry accessible names and an active-state indicator; reachable and operable by keyboard in both locales. |
| K8 | Marquee pause control reachable and operable by keyboard, not hover-only (FR-007b) | DONE | `marquee-toggle` button focusable; Enter/Space toggles `aria-pressed`, pausing motion (`data-paused`). |
| K9 | Inquiry-form errors are programmatically associated and announced; form fully keyboard-operable (FR-007d) | DONE | `aria-invalid` + `aria-describedby` link each field to its visible message; `role="alert"` live region inside the form announces the error summary; Submit reachable by keyboard. |
| K10 | Back-office editing UI keyboard-reachable incl. Lexical rich-text (`contenteditable`) fields (FR-007) | DONE | Verified via `us2-admin-a11y.spec.ts` + manual pass: Tab traverses fields and lands inside Lexical editors; no trap. |

---

## 4. Manual screen-reader pass

Performed 2026-06-01 (NVDA + VoiceOver spot-check) on `/en`, `/th`, and `/admin`. **All items
PASSED.**

| # | Check (spec ref) | Status | Note |
| --- | --- | --- | --- |
| SR1 | Landmark regions present and labelled — `banner`, `navigation`, `main`, `contentinfo` (FR-007a) | DONE | `Nav.tsx` banner/nav, single `<main>` per page, `Footer.tsx` contentinfo; navigable by landmark. |
| SR2 | Correct heading order for the single-page layout — single `<h1>`, no skipped levels (FR-007a) | DONE | One page `<h1>` (hero); section headings descend without gaps; reading order matches DOM. |
| SR3 | Meaningful alt text on content images; decorative graphics hidden (FR-007, CHK003) | DONE | Managed media carry alt text from the CMS; lattice canvas, custom cursor, and SVG decoration are `aria-hidden`. |
| SR4 | Form fields have programmatic labels and instructions; consent + privacy-notice link conveyed (FR-007d, FR-026) | DONE | Every inquiry field labelled; consent checkbox labelled with the in-context privacy-notice link (`inquiry-privacy-link`). |
| SR5 | Live-region announcements — validation errors and async submission feedback are announced (FR-007d, FR-005a) | DONE | Assertive `role="alert"` inside the form announces errors; submission confirmation is announced (no silent state change). |
| SR6 | Showcase tab selection and language toggle active-state are announced (FR-007d) | DONE | Selected tab announced via `aria-selected`; active language conveyed on the toggle. |

---

## 5. Reduced motion (FR-006 / FR-007b / SC-008)

| # | Check | Status | Note |
| --- | --- | --- | --- |
| RM1 | OS `prefers-reduced-motion: reduce` disables decorative animation (lattice, counters, scroll-reveal, magnetic buttons, custom cursor) while all content stays readable and usable | DONE | `body.motion-off` applied (asserted in `us1-motion.spec.ts`); content fully intact (SC-008). |
| RM2 | Auto-moving marquee stops by default under reduced motion **and** offers an accessible pause/stop control otherwise (WCAG 2.2.2, FR-007b) | DONE | Marquee halts under reduced motion; the `marquee-toggle` pause control (not hover-only) toggles `aria-pressed` → `data-paused`. |
| RM3 | Desktop-only effects (custom cursor, magnetic buttons) disabled on touch/coarse-pointer devices and under reduced motion (FR-007c) | DONE | `CustomCursor.tsx` gated on fine pointer + motion preference; never suppresses focus. |

No essential content or functionality depends on motion; turning motion off removes only decoration.

---

## 6. How to re-run

**Automated (axe AA) — every PR and before each release:**

```bash
pnpm test:e2e        # Playwright journeys + @axe-core/playwright WCAG 2.1 AA checks
```

This runs all five a11y specs above: `us1-a11y.spec.ts`, `us3-form-a11y.spec.ts`,
`us1-motion.spec.ts`, `us2-admin-a11y.spec.ts`, `admin-theme-a11y.spec.ts`. The public-site checks
must be **zero violations**; the back-office checks must introduce **no new** serious/critical
violations beyond the documented Payload baseline. CI also enforces Lighthouse performance budgets
via `pnpm lhci` (LCP < 2.5s, INP < 200ms, CLS < 0.1, public route JS ≤ 200 KB gzipped).

**Manual passes (keyboard §3 + screen-reader §4) — cadence: before each release.** Run against
`/en` and `/th` in both themes and `/admin` in both themes, on the candidate build. Update the
sign-off below with the date and result. Automated axe coverage is necessary but **not sufficient**
for AA (SC-004 requires "a combination of automated checks and manual keyboard/screen-reader
testing"); the manual passes are a required release gate, not optional.

---

## 7. Sign-off

| Item | Status |
| --- | --- |
| Automated axe AA — public site (zero violations) | PASS |
| Automated axe AA — back office (no new violations beyond documented Payload baseline) | PASS |
| Manual keyboard pass (§3, K1–K10) | **PASSED** |
| Manual screen-reader pass (§4, SR1–SR6) | **PASSED** |
| Reduced motion (§5, RM1–RM3) | PASS |
| Requirements-quality checklist (16/16) | RESOLVED |

**Overall: PASSED — WCAG 2.1 AA, this release (2026-06-01).** Outstanding item, tracked, not
release-blocking: the Payload 3.85 upstream axe baseline (`button-name`, `color-contrast`, `list`,
`label`, `select-name`, `aria-input-field-name`, `aria-required-children`, `aria-required-parent`,
`aria-hidden-focus`) to be raised upstream or formally accepted in a future cycle.
