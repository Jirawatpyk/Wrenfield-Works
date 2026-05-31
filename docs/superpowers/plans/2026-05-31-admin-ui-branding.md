# Admin UI: Branding, Editor Guidance & Editorial Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brand the Payload `/admin` back office (logo/favicon/title), add bilingual editor guidance (welcome card, EN/TH publish-readiness, per-document status, field help, a bilingual publish-block error), and apply a full editorial theme — dark by default, switchable, WCAG 2.1 AA in both themes.

**Architecture:** Pure logic lives in `src/lib/**` (unit-tested first). EN/TH completeness logic is extracted from the publish gate so the badge and the gate agree by construction. A SCSS foundation (theme variable overrides + reusable `.wf-*` classes + status tokens) lands **before** the React components, so components carry classNames and the theme controls all color/spacing in one place (token-driven, AA in both themes). Admin React components (`src/components/admin/`) are thin. Theme overrides only Payload's documented CSS variables — never internal classes — so it survives upgrades. Rendering/visual/a11y is verified with Playwright + axe.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3.85, TypeScript, Vitest (node env), Playwright + @axe-core/playwright, `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-05-31-admin-ui-branding-design.md`

---

## Design-review revisions baked into this plan

This plan was reviewed by the `ui-design-engineer` and `ux-design-reviewer` agents before implementation. Their Critical + Should-fix findings are integrated (not deferred). User decisions taken:

- **Status pills `Published` / `Draft` stay English** (FR-011 English-only label set). EN/TH column headers use fixed two-letter `EN` / `TH` chips, not translated words.
- **The publish-block error is translated EN/TH + uses field labels** (Task 12). This touches `publishCompleteness.ts` (US2) but changes *presentation only* — the gate still blocks identically; the EN message keeps the phrase "Cannot publish … both English and Thai" so the existing regression regex still matches.

Key structural changes vs. the first draft:
- **New early Task 5 (SCSS foundation):** defines `:root` base fallbacks (so the login screen is themed even before the provider runs), per-theme overrides incl. `--theme-elevation-600`, **status tokens `--theme-success-50` / `--theme-error-50` per theme** (the first draft referenced these but never defined them → invisible pastel badges), reusable `.wf-card` / `.wf-status-badge` classes, Fraunces wired at `:root` (covers portals/modals), and focus-visible rings.
- **Components use classNames, not inline magic hex** (token discipline).
- **A11y gate (Task 14) treats `color-contrast` on our `.wf-*` nodes as blocking** while still forgiving Payload's upstream chrome — otherwise our own contrast mistakes pass silently.
- **Per-document status banner (Task 10) is honest about staleness:** a small client wrapper reads `useFormModified()` and shows a "not yet included your latest edits" warning + a re-check (save-draft) affordance, so the banner never silently contradicts what the editor just typed.
- **Readiness panel (Task 9):** distinguishes *not started* / *missing a language* / *error*; shows a positive progress summary; lists missing fields per locale; links each type to its edit view; loads rows in parallel.
- **Field help (Task 11):** the 6 content types that most need it, not just 2.

---

## Conventions for every task

- Run unit tests: `pnpm test tests/unit/<file>.spec.ts`
- Run integration: `pnpm test:integration` (resets the test DB, then runs `tests/integration`). Needs Postgres: `docker compose up -d db`.
- Run a single e2e file: `pnpm test:e2e tests/e2e/<file>.spec.ts` (Playwright auto-runs `pnpm build && pnpm start`).
- After schema/config edits that change types: `pnpm generate:types`
- After adding/removing any `admin.components.*` path: `pnpm generate:importmap` (regenerates `src/app/(payload)/admin/importMap.js`)
- Existing e2e admin helpers (`tests/e2e/admin-helpers.ts`): `loginAsAdmin(page)` (goto `/admin/login` + sign in seeded `admin@wrenfield.test` + wait for dashboard), `gotoGlobal(page, slug)`, `gotoCollection(page, slug)`.

---

## File structure (created/modified)

```
CREATE  src/lib/validation/localeFields.ts        # shared isBlank + localized-leaf walker (passes field label)
MODIFY  src/lib/validation/publishCompleteness.ts # consume localeFields; bilingual labelled error (Task 12)
CREATE  src/lib/admin/completeness.ts             # per-locale status + detailed missing (reuses localeFields)
CREATE  src/lib/admin/adminCopy.ts               # bilingual EN/TH custom strings + types
CREATE  src/lib/admin/contentTypes.ts             # content registry from config + path→label map

CREATE  src/app/(payload)/custom.scss             # SCSS foundation: tokens + .wf-* classes (Task 5; rewritten)
CREATE  src/components/admin/BrandIcon.tsx        # mark (currentColor + brass ring), graphics.Icon
CREATE  src/components/admin/BrandLogo.tsx        # mark + wordmark, graphics.Logo
CREATE  src/components/admin/WelcomeCard.tsx      # beforeDashboard (server, bilingual)
CREATE  src/components/admin/PublishReadiness.tsx # beforeDashboard (server, readiness table)
CREATE  src/components/admin/LocaleStatusField.tsx# ui field (server status + client stale wrapper)
CREATE  src/components/admin/LocaleStatusClient.tsx# 'use client' dirty-state warning + re-check
CREATE  src/components/admin/DefaultDarkTheme.tsx # providers (default dark on first visit)

MODIFY  src/fields/localized.ts                   # description: string | {en,th}
MODIFY  src/app/(payload)/layout.tsx              # add wf-admin-fonts class hook
MODIFY  src/payload.config.ts                     # wire components/meta/theme/i18n + ui field
CREATE  public/favicon.svg                        # brand favicon (copied from handoff)

CREATE  tests/unit/locale-fields.spec.ts
CREATE  tests/unit/completeness.spec.ts
CREATE  tests/unit/admin-copy.spec.ts
CREATE  tests/integration/admin-gate-error.spec.ts
CREATE  tests/e2e/admin-branding.spec.ts
CREATE  tests/e2e/admin-guidance.spec.ts
CREATE  tests/e2e/admin-theme-a11y.spec.ts
```

---

## Task 1: Extract the shared localized-leaf walker

Pull `isBlank`, the value-field type set, and the schema walk out of `publishCompleteness.ts` into a reusable module so the readiness badge, the gate, and the bilingual error all share one definition of "complete" and one path→label mapping. The walker passes the field's human **label** to the visitor (needed by Task 12). The gate's blocking behavior must not change — `tests/integration/us2-publish-gate.spec.ts` is the regression guard.

**Files:**
- Create: `src/lib/validation/localeFields.ts`
- Create (test): `tests/unit/locale-fields.spec.ts`
- Modify: `src/lib/validation/publishCompleteness.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/locale-fields.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { Field } from 'payload'
import { isBlank, walkLocalizedLeaves } from '@/lib/validation/localeFields'

describe('isBlank', () => {
  it('treats null/undefined/empty-string/whitespace/empty-array as blank', () => {
    expect(isBlank(null)).toBe(true)
    expect(isBlank(undefined)).toBe(true)
    expect(isBlank('')).toBe(true)
    expect(isBlank('   ')).toBe(true)
    expect(isBlank([])).toBe(true)
  })

  it('treats non-empty strings/arrays as present', () => {
    expect(isBlank('hi')).toBe(false)
    expect(isBlank([1])).toBe(false)
  })

  it('treats a Lexical richText with text as present and empty as blank', () => {
    const empty = { root: { children: [{ type: 'paragraph', children: [] }] } }
    const full = { root: { children: [{ type: 'paragraph', children: [{ text: 'hello' }] }] } }
    expect(isBlank(empty)).toBe(true)
    expect(isBlank(full)).toBe(false)
  })
})

describe('walkLocalizedLeaves', () => {
  it('visits every localized value leaf with path, {en,th} value, and label', () => {
    const fields: Field[] = [
      { name: 'kicker', type: 'text', localized: true, label: 'Kicker' },
      { name: 'unit', type: 'text' }, // not localized → skipped
      {
        name: 'rows',
        type: 'array',
        fields: [{ name: 'label', type: 'text', localized: true }],
      },
    ]
    const data = {
      kicker: { en: 'A', th: '' },
      unit: { en: 'kg', th: 'kg' },
      rows: [{ label: { en: 'r0', th: 'r0' } }],
    }
    const seen: Array<{ path: string; value: unknown; label: string }> = []
    walkLocalizedLeaves(fields, data, '', (path, value, label) => seen.push({ path, value, label }))
    expect(seen).toEqual([
      { path: 'kicker', value: { en: 'A', th: '' }, label: 'Kicker' },
      { path: 'rows[0].label', value: { en: 'r0', th: 'r0' }, label: 'label' },
    ])
  })

  it('descends through row, group, named tabs, and blocks', () => {
    const fields: Field[] = [
      { type: 'row', fields: [{ name: 'a', type: 'text', localized: true }] },
      { name: 'grp', type: 'group', fields: [{ name: 'b', type: 'text', localized: true }] },
      { type: 'tabs', tabs: [{ name: 'tab1', fields: [{ name: 'c', type: 'text', localized: true }] }] },
      {
        name: 'blk',
        type: 'blocks',
        blocks: [{ slug: 'quote', fields: [{ name: 'd', type: 'text', localized: true }] }],
      },
    ]
    const data = {
      a: { en: 'a', th: 'a' },
      grp: { b: { en: 'b', th: 'b' } },
      tab1: { c: { en: 'c', th: 'c' } },
      blk: [{ blockType: 'quote', d: { en: 'd', th: 'd' } }],
    }
    const paths: string[] = []
    walkLocalizedLeaves(fields, data, '', (p) => paths.push(p))
    expect(paths).toEqual(['a', 'grp.b', 'tab1.c', 'blk[0].d'])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/locale-fields.spec.ts`
Expected: FAIL — `Cannot find module '@/lib/validation/localeFields'`.

- [ ] **Step 3: Create the module**

Create `src/lib/validation/localeFields.ts`:

```ts
import type { Field } from 'payload'

/**
 * Shared localized-field utilities (T1). The publish gate
 * (`publishCompleteness.ts`), the admin readiness badge (`lib/admin/
 * completeness.ts`), and the bilingual publish-block error all walk a
 * `locale: 'all'`-shaped document the same way, so "what counts as complete"
 * and "what is this field called" are defined exactly once here.
 */

export type AnyRecord = Record<string, unknown>

/** Localized value field types whose leaves carry an `{ en, th }` map under `locale: 'all'`. */
export const VALUE_FIELD_TYPES = new Set([
  'text',
  'textarea',
  'richText',
  'email',
  'number',
  'select',
  'code',
  'date',
])

/** True when a value is missing/empty (string, array, or empty Lexical richText). */
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    const root = (value as AnyRecord).root as AnyRecord | undefined
    if (root && Array.isArray(root.children)) {
      const serialized = JSON.stringify(root.children)
      return !/"text":"\s*\S/.test(serialized) && !serialized.includes('"type":"upload"')
    }
  }
  return false
}

/** Human label for a field: explicit string label, else the field name. */
function labelOf(field: Field): string {
  if ('label' in field && typeof field.label === 'string' && field.label) return field.label
  if ('name' in field && field.name) return field.name
  return ''
}

/**
 * Walk the schema over a `locale: 'all'`-shaped doc and invoke
 * `visit(path, value, label)` for every localized value-field leaf. `value` is
 * the stored leaf (an `{ en, th }` map when present); `label` is the leaf field's
 * human label. Descends through row/collapsible, group, named/unnamed tabs,
 * array, and blocks.
 */
export function walkLocalizedLeaves(
  fields: Field[],
  data: AnyRecord,
  prefix: string,
  visit: (path: string, value: unknown, label: string) => void,
): void {
  for (const field of fields) {
    if (field.type === 'ui') continue

    if ((field.type === 'row' || field.type === 'collapsible') && 'fields' in field) {
      walkLocalizedLeaves(field.fields, data, prefix, visit)
      continue
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          walkLocalizedLeaves(
            tab.fields,
            (data?.[tab.name] as AnyRecord) ?? {},
            `${prefix}${tab.name}.`,
            visit,
          )
        } else {
          walkLocalizedLeaves(tab.fields, data, prefix, visit)
        }
      }
      continue
    }

    if (!('name' in field) || !field.name) continue
    const path = `${prefix}${field.name}`
    const localized = 'localized' in field && field.localized === true
    const value = data?.[field.name]

    if (VALUE_FIELD_TYPES.has(field.type)) {
      if (localized) visit(path, value, labelOf(field))
      continue
    }

    if (field.type === 'group' && 'fields' in field) {
      walkLocalizedLeaves(field.fields, (value as AnyRecord) ?? {}, `${path}.`, visit)
      continue
    }

    if (field.type === 'array' && 'fields' in field) {
      const rows = Array.isArray(value) ? (value as AnyRecord[]) : []
      rows.forEach((row, i) => {
        walkLocalizedLeaves(field.fields, row ?? {}, `${path}[${i}].`, visit)
      })
      continue
    }

    if (field.type === 'blocks' && 'blocks' in field) {
      const rows = Array.isArray(value) ? (value as AnyRecord[]) : []
      rows.forEach((row, i) => {
        const block = field.blocks.find((b) => b.slug === row?.blockType)
        if (block) walkLocalizedLeaves(block.fields, row ?? {}, `${path}[${i}].`, visit)
      })
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/locale-fields.spec.ts`
Expected: PASS.

- [ ] **Step 5: Refactor `publishCompleteness.ts` to consume the shared module**

In `src/lib/validation/publishCompleteness.ts`:

(a) Delete the local `AnyRecord` type, the local `VALUE_FIELD_TYPES` set, and the local `isBlank` function. Add near the other imports:

```ts
import { isBlank, walkLocalizedLeaves, VALUE_FIELD_TYPES, type AnyRecord } from './localeFields'
```

Keep the local `LocaleMap` type and `localeMapIncomplete`:

```ts
type LocaleMap = { en?: unknown; th?: unknown }

/** A localized leaf under `locale: 'all'` is `{ en, th }`; incomplete if either is blank. */
function localeMapIncomplete(value: unknown): boolean {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return true
  }
  const map = value as LocaleMap
  return isBlank(map.en) || isBlank(map.th)
}
```

(b) Replace the whole `collectMissing` function body with a thin wrapper over the shared walker:

```ts
/** Walk the schema over a `locale: 'all'`-shaped doc, collecting incomplete localized leaves. */
function collectMissing(fields: Field[], data: AnyRecord, prefix: string): string[] {
  const missing: string[] = []
  walkLocalizedLeaves(fields, data, prefix, (path, value) => {
    if (localeMapIncomplete(value)) missing.push(path)
  })
  return missing
}
```

Leave `overlayActiveLocale`, `getFields`, `fetchAllLocales`, `publishCompletenessHook`, and the `__test` export unchanged for now (Task 12 revisits the error message). `VALUE_FIELD_TYPES` is still referenced inside `overlayActiveLocale`, now via the import.

- [ ] **Step 6: Verify types + the new unit test**

Run: `pnpm test tests/unit/locale-fields.spec.ts && pnpm typecheck`
Expected: unit PASS; `tsc --noEmit` clean.

- [ ] **Step 7: Run the publish-gate regression guard**

Run: `pnpm test:integration`
Expected: PASS — `tests/integration/us2-publish-gate.spec.ts` and the other US2 specs stay green (extraction didn't change behavior).

- [ ] **Step 8: Commit**

```bash
git add src/lib/validation/localeFields.ts src/lib/validation/publishCompleteness.ts tests/unit/locale-fields.spec.ts
git commit -m "refactor: extract shared localized-leaf walker (localeFields)

Single source of truth for isBlank + the schema walk (now also surfacing
field labels), consumed by the publish gate and the admin readiness badge.
Gate behavior unchanged — us2-publish-gate integration suite stays green.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Per-locale EN/TH status logic

A pure module that reports per-locale completeness of one document: which localized paths are missing EN / TH (with labels), convenience booleans, and whether the doc is entirely empty ("not started" — used by the readiness panel's neutral state).

**Files:**
- Create: `src/lib/admin/completeness.ts`
- Create (test): `tests/unit/completeness.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/completeness.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { Field } from 'payload'
import { collectLocaleStatus } from '@/lib/admin/completeness'

const fields: Field[] = [
  { name: 'kicker', type: 'text', localized: true, label: 'Kicker' },
  { name: 'unit', type: 'text' }, // non-localized → ignored
  { name: 'rows', type: 'array', fields: [{ name: 'label', type: 'text', localized: true, label: 'Row label' }] },
]

describe('collectLocaleStatus', () => {
  it('reports both complete when every localized leaf has en and th', () => {
    const doc = {
      kicker: { en: 'Hi', th: 'สวัสดี' },
      unit: { en: 'kg', th: 'kg' },
      rows: [{ label: { en: 'A', th: 'ก' } }],
    }
    const s = collectLocaleStatus(fields, doc)
    expect(s.enComplete).toBe(true)
    expect(s.thComplete).toBe(true)
    expect(s.empty).toBe(false)
    expect(s.missing).toEqual([])
  })

  it('flags TH gaps with labels when only English is filled', () => {
    const doc = { kicker: { en: 'Hi', th: '' }, rows: [{ label: { en: 'A', th: '' } }] }
    const s = collectLocaleStatus(fields, doc)
    expect(s.enComplete).toBe(true)
    expect(s.thComplete).toBe(false)
    expect(s.empty).toBe(false)
    expect(s.missing).toEqual([
      { path: 'kicker', label: 'Kicker', en: false, th: true },
      { path: 'rows[0].label', label: 'Row label', en: false, th: true },
    ])
  })

  it('marks an entirely-empty doc as empty (not started) with both locales missing', () => {
    const s = collectLocaleStatus(fields, {})
    expect(s.enComplete).toBe(false)
    expect(s.thComplete).toBe(false)
    expect(s.empty).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/completeness.spec.ts`
Expected: FAIL — `Cannot find module '@/lib/admin/completeness'`.

- [ ] **Step 3: Implement the module**

Create `src/lib/admin/completeness.ts`:

```ts
import type { Field } from 'payload'

import { isBlank, walkLocalizedLeaves, type AnyRecord } from '@/lib/validation/localeFields'

/** One missing localized leaf: which locales are present. `en`/`th` are TRUE when that locale is FILLED. */
export type MissingLeaf = { path: string; label: string; en: boolean; th: boolean }

/** Per-locale completeness of one content document (admin readiness, T2). */
export type LocaleStatus = {
  enComplete: boolean
  thComplete: boolean
  /** True when the document has NO localized value in either locale — "not started". */
  empty: boolean
  /** Leaves missing at least one locale, each with its label and per-locale presence. */
  missing: MissingLeaf[]
}

type LocaleMap = { en?: unknown; th?: unknown }

/**
 * Compute per-locale status by walking the schema over a `locale: 'all'`-shaped
 * doc. Uses the same `isBlank` + walker as the publish gate, so the badge can
 * never disagree with what the gate allows (FR-014). `empty` lets the UI show a
 * neutral "not started" state instead of an alarming all-red row.
 */
export function collectLocaleStatus(fields: Field[], doc: AnyRecord): LocaleStatus {
  const missing: MissingLeaf[] = []
  let anyLeaf = false
  let anyValue = false

  walkLocalizedLeaves(fields, doc, '', (path, value, label) => {
    anyLeaf = true
    const map = (value && typeof value === 'object' && !Array.isArray(value)
      ? (value as LocaleMap)
      : {}) as LocaleMap
    const enFilled = !isBlank(map.en)
    const thFilled = !isBlank(map.th)
    if (enFilled || thFilled) anyValue = true
    if (!enFilled || !thFilled) missing.push({ path, label, en: enFilled, th: thFilled })
  })

  const enComplete = missing.every((m) => m.en)
  const thComplete = missing.every((m) => m.th)
  return {
    enComplete,
    thComplete,
    empty: anyLeaf && !anyValue,
    missing,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/completeness.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/completeness.ts tests/unit/completeness.spec.ts
git commit -m "feat: per-locale EN/TH completeness status (labels + empty state)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Bilingual admin copy + key-parity test

All custom admin prose in one typed module, each as an `{ en, th }` map. A test fails if any key is missing either locale. Copy is reworded per the UX review (honest staleness, expectation-aligned welcome text, "พร้อม/ยังไม่พร้อม"). Note: `Published`/`Draft`/`EN`/`TH` are intentionally **not** here — they are English-only literals rendered directly in components (FR-011).

**Files:**
- Create: `src/lib/admin/adminCopy.ts`
- Create (test): `tests/unit/admin-copy.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/admin-copy.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { adminCopy } from '@/lib/admin/adminCopy'

describe('adminCopy', () => {
  it('has a non-empty EN and TH string for every key', () => {
    for (const [key, value] of Object.entries(adminCopy)) {
      expect(value.en, `${key}.en`).toBeTypeOf('string')
      expect(value.th, `${key}.th`).toBeTypeOf('string')
      expect(value.en.trim().length, `${key}.en non-empty`).toBeGreaterThan(0)
      expect(value.th.trim().length, `${key}.th non-empty`).toBeGreaterThan(0)
    }
  })

  it('exposes the keys the guidance components use', () => {
    for (const key of [
      'welcomeTitle',
      'welcomeBody',
      'publishRule',
      'readinessTitle',
      'readinessProgress',
      'statusReady',
      'statusNotReady',
      'statusNotStarted',
      'readinessError',
      'localeStatusTitle',
      'localeStatusHint',
      'localeStatusStale',
      'recheckLabel',
      'missingEnLabel',
      'missingThLabel',
    ]) {
      expect(adminCopy, key).toHaveProperty(key)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/admin-copy.spec.ts`
Expected: FAIL — `Cannot find module '@/lib/admin/adminCopy'`.

- [ ] **Step 3: Implement the module**

Create `src/lib/admin/adminCopy.ts`:

```ts
/**
 * Bilingual custom strings for the admin back office (T3). Each entry is an
 * `{ en, th }` map, resolved with `getTranslation(entry, i18n)` from
 * `@payloadcms/translations` to the editor's chosen admin language. The unit test
 * enforces both locales (i18n gate for our own copy). `{n}`/`{total}` are simple
 * placeholders substituted at render time.
 *
 * NOT here (English-only literals per FR-011, rendered directly in components):
 * the `Published` / `Draft` status pills and the `EN` / `TH` column chips.
 */
export type Copy = { en: string; th: string }

export const adminCopy = {
  welcomeTitle: {
    en: 'Welcome to Wrenfield Works',
    th: 'ยินดีต้อนรับสู่ Wrenfield Works',
  },
  welcomeBody: {
    en: 'This is where you edit the public website — text, case studies, stats, and more.',
    th: 'นี่คือที่สำหรับแก้ไขเว็บไซต์สาธารณะ ทั้งข้อความ ผลงาน สถิติ และส่วนอื่น ๆ',
  },
  // Expectation-aligned: condition first, result second (UX S3).
  publishRule: {
    en: 'Once both English and Thai are filled in and you publish, your changes appear on the website right away. You can save an incomplete draft anytime, but publishing is blocked until both languages are complete.',
    th: 'เมื่อกรอกครบทั้งภาษาอังกฤษและภาษาไทยแล้วกดเผยแพร่ การเปลี่ยนแปลงจะแสดงบนเว็บไซต์ทันที คุณบันทึกเป็นฉบับร่างไว้ก่อนได้แม้ยังกรอกไม่ครบ แต่จะเผยแพร่ไม่ได้จนกว่าจะกรอกครบทั้งสองภาษา',
  },
  readinessTitle: {
    en: 'Publish readiness',
    th: 'ความพร้อมในการเผยแพร่',
  },
  readinessProgress: {
    en: '{n} of {total} ready to publish',
    th: 'พร้อมเผยแพร่ {n} จาก {total} รายการ',
  },
  statusReady: { en: 'Ready', th: 'พร้อม' },
  statusNotReady: { en: 'Not ready', th: 'ยังไม่พร้อม' },
  statusNotStarted: { en: 'Not started', th: 'ยังไม่เริ่ม' },
  readinessError: { en: 'Could not load', th: 'โหลดไม่สำเร็จ' },
  localeStatusTitle: {
    en: 'Saved version status',
    th: 'สถานะของฉบับที่บันทึกไว้',
  },
  // Honest about staleness (UX C1): says what it reflects and what it does not.
  localeStatusHint: {
    en: 'Shows the last saved version — not what you are typing now. Save a draft to update it.',
    th: 'แสดงสถานะของฉบับที่บันทึกล่าสุด ไม่ใช่สิ่งที่กำลังพิมพ์อยู่ตอนนี้ กดบันทึกฉบับร่างเพื่ออัปเดต',
  },
  localeStatusStale: {
    en: 'You have unsaved edits — this status does not include them yet.',
    th: 'มีการแก้ไขที่ยังไม่บันทึก สถานะนี้ยังไม่รวมการแก้ไขล่าสุด',
  },
  recheckLabel: {
    en: 'Save draft to re-check',
    th: 'บันทึกฉบับร่างเพื่อตรวจสอบใหม่',
  },
  missingEnLabel: {
    en: 'English still needed:',
    th: 'ยังขาดภาษาอังกฤษ:',
  },
  missingThLabel: {
    en: 'Thai still needed:',
    th: 'ยังขาดภาษาไทย:',
  },
} satisfies Record<string, Copy>

export type AdminCopyKey = keyof typeof adminCopy

/** Substitute `{key}` placeholders in a resolved string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/admin-copy.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/adminCopy.ts tests/unit/admin-copy.spec.ts
git commit -m "feat: bilingual admin copy (reworded for UX) + key-parity test

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Content-type registry + path→label map

Lists the editorial globals + draft-enabled collections with their fields, plus a helper to resolve a field path (e.g. `rows[0].label`) to a human label — used by the readiness panel, the status banner, and the bilingual gate error.

**Files:**
- Create: `src/lib/admin/contentTypes.ts`

> No unit test: reads the live Payload runtime shape; exercised by e2e (Task 9) and the gate-error integration test (Task 12). Keep it small and declarative.

- [ ] **Step 1: Implement the module**

Create `src/lib/admin/contentTypes.ts`:

```ts
import type { Field, Payload, SanitizedConfig } from 'payload'

/** A content type the readiness panel reports on (T4). */
export type ContentType = {
  kind: 'global' | 'collection'
  slug: string
  label: string
  fields: Field[]
  /** Admin edit-view URL for this type (collections link to the list view). */
  href: string
}

/** Collections that are NOT editorial content (no EN/TH publish gate). */
const NON_CONTENT_COLLECTIONS = new Set([
  'users',
  'media',
  'payload-preferences',
  'payload-migrations',
])

export function titleFromSlug(slug: string): string {
  return slug
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Derive editorial content types from the sanitized config: every global, plus
 * collections that opt into drafts and aren't infrastructure. Mirrors exactly the
 * set wired with the publish-completeness gate, so the readiness table can't list
 * the wrong things.
 */
export function getContentTypes(payload: Payload): ContentType[] {
  const config = payload.config as SanitizedConfig
  const out: ContentType[] = []

  for (const g of config.globals ?? []) {
    out.push({
      kind: 'global',
      slug: g.slug,
      label: g.label ? String(g.label) : titleFromSlug(g.slug),
      fields: g.fields,
      href: `/admin/globals/${g.slug}`,
    })
  }

  for (const c of config.collections ?? []) {
    if (NON_CONTENT_COLLECTIONS.has(c.slug)) continue
    const hasDrafts = Boolean((c.versions as { drafts?: unknown } | undefined)?.drafts)
    if (!hasDrafts) continue
    out.push({
      kind: 'collection',
      slug: c.slug,
      label: titleFromSlug(c.slug),
      fields: c.fields,
      href: `/admin/collections/${c.slug}`,
    })
  }

  return out
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin/contentTypes.ts
git commit -m "feat: editorial content-type registry (with edit-view href)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: SCSS foundation — theme tokens + reusable classes

The styling foundation everything else references. Overrides Payload's documented theme variables for both themes (incl. the ones the first draft missed: `--theme-elevation-600`, `--theme-success-50`, `--theme-error-50`), adds `:root` base fallbacks (so the **login screen is themed before the provider runs**, UI C4), wires Fraunces at `:root` so it reaches portals/modals (UI S4), and defines reusable `.wf-*` classes so components carry no magic hex (token discipline, UI S1).

**Files:**
- Modify: `src/app/(payload)/custom.scss`
- Modify: `src/app/(payload)/layout.tsx`

- [ ] **Step 1: Write the SCSS foundation**

Replace the contents of `src/app/(payload)/custom.scss`:

```scss
/* Custom Payload admin styles (T5). Back-office UI must meet WCAG 2.1 AA (FR-007).
   Override Payload's DOCUMENTED theme variables ONLY (never internal classes) so
   this survives Payload upgrades. Palette mirrors src/styles/tokens.css.
   All contrast pairs chosen for >=4.5:1 normal text / >=3:1 large/UI in BOTH themes. */

/* Brand raw palette. */
:root {
  --wf-ink: #15181d;
  --wf-ink-2: #1e242c;
  --wf-paper: #ece5d8;
  --wf-paper-2: #f5f0e6;
  --wf-brass: #cba265;
  --wf-brass-deep: #b5894a;

  /* Base fallbacks used before <html data-theme> is set (e.g. the login screen
     for the instant before the theme provider runs). Dark-leaning brand default. */
  --theme-bg: var(--wf-ink);
  --theme-text: #ece5d8;
  --theme-brand-accent: var(--wf-brass);

  /* Fraunces for admin headings. Declared at :root so it also reaches Payload
     drawers/modals/toasts that portal to document.body (outside any wrapper). */
  --wf-font-serif: var(--font-serif, 'Fraunces', Georgia, serif);
}

/* DARK theme — ink surfaces, brass accent. */
[data-theme='dark'] {
  --theme-bg: var(--wf-ink);
  --theme-input-bg: #20262e;
  --theme-text: #ece5d8;
  --theme-elevation-0: #15181d;
  --theme-elevation-50: #1a1f26;
  --theme-elevation-100: #1e242c;
  --theme-elevation-150: #252c35;
  --theme-elevation-200: #2c343e;
  --theme-elevation-600: #a0a7b0; /* >=6.5:1 on elevation-50 */
  --theme-elevation-700: #b9c0c8; /* muted text >=7.9:1 on elevation-100 */
  --theme-elevation-800: #d6dbe0;
  --theme-elevation-900: #ece5d8;
  --theme-brand-accent: var(--wf-brass);
  --theme-success-500: #86b88a; /* tick on ink >=7:1 */
  --theme-error-500: #e0908c; /* tick on ink >=6.5:1 */
  --theme-success-50: #1d2a22; /* badge bg (dark mint) */
  --theme-error-50: #2c1d1f; /* badge bg (dark maroon) */
}

/* LIGHT (paper) theme — paper surfaces, darkened bronze accent for AA on light. */
[data-theme='light'] {
  --theme-bg: var(--wf-paper);
  --theme-input-bg: #f5f0e6;
  --theme-text: #15181d;
  --theme-elevation-0: #f5f0e6;
  --theme-elevation-50: #efe8da;
  --theme-elevation-100: #e7dfce;
  --theme-elevation-150: #ddd3bf;
  --theme-elevation-200: #cfc4ad;
  --theme-elevation-600: #5c5446; /* muted text >=6.8:1 on paper */
  --theme-elevation-700: #4a4338; /* >=8.9:1 on paper */
  --theme-brand-accent: #6f5325; /* bronze, >=5.5:1 as text on paper */
  --theme-success-500: #2f7a45; /* tick on paper >=4.7:1 */
  --theme-error-500: #a13a3a; /* tick on paper >=5.9:1 */
  --theme-success-50: #e7f3ec; /* badge bg (light mint) */
  --theme-error-50: #f7e9e9; /* badge bg (light maroon) */
}

/* Headings in the brand serif (variable reaches portals via :root). */
.wf-admin-fonts h1,
.wf-admin-fonts h2,
.wf-admin-fonts h3,
.wf-card h2,
.wf-card h3 {
  font-family: var(--wf-font-serif);
}

/* Reusable guidance card / panel. Thai body needs the looser line-height. */
.wf-card {
  border: 1px solid var(--theme-elevation-150);
  background: var(--theme-elevation-50);
  border-radius: var(--r-sm, 8px);
  padding: 20px 24px;
  margin-bottom: 24px;
  line-height: 1.6;
}
.wf-card__body {
  color: var(--theme-elevation-700);
  margin: 0 0 12px;
}
.wf-card__rule {
  margin: 0;
  padding: 10px 14px;
  border-left: 3px solid var(--theme-brand-accent);
  background: var(--theme-elevation-100);
  border-radius: 4px;
  color: var(--theme-text);
}

/* Readiness table. */
.wf-readiness {
  width: 100%;
  border-collapse: collapse;
}
.wf-readiness th {
  text-align: left;
  padding: 4px 8px;
  color: var(--theme-elevation-700);
  font-weight: 600;
}
.wf-readiness td {
  padding: 6px 8px;
  border-top: 1px solid var(--theme-elevation-100);
}
.wf-readiness a {
  color: var(--theme-brand-accent);
  text-decoration: underline;
}
.wf-readiness__summary {
  margin: 0 0 12px;
  color: var(--theme-text);
  font-weight: 600;
}

/* EN/TH status badges (used in table cells and the per-doc banner). */
.wf-badge {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--r-pill, 999px);
  border: 1px solid var(--theme-elevation-200);
}
.wf-badge--ok {
  background: var(--theme-success-50);
  color: var(--theme-success-500);
}
.wf-badge--bad {
  background: var(--theme-error-50);
  color: var(--theme-error-500);
}
.wf-badge--neutral {
  background: var(--theme-elevation-100);
  color: var(--theme-elevation-700);
}

/* Per-document status banner. */
.wf-locale-status {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin: 0 0 16px;
}
.wf-locale-status__hint {
  color: var(--theme-elevation-600);
}
.wf-locale-status__stale {
  width: 100%;
  margin: 4px 0 0;
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--theme-error-50);
  color: var(--theme-error-500);
  border: 1px solid var(--theme-error-500);
}

/* Brand lockup on the login screen. */
.wf-brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--theme-text);
}
.wf-brand-logo__word {
  font-family: var(--wf-font-serif);
  font-size: 1.6rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.wf-brand-logo__accent {
  color: var(--theme-brand-accent);
}

/* Brand accent on primary actions + visible focus (AA focus-visible). */
.btn--style-primary {
  --color: var(--theme-brand-accent);
}
:focus-visible {
  outline: 2px solid var(--theme-brand-accent);
  outline-offset: 2px;
}
```

> `--r-sm` / `--r-pill` come from `src/styles/tokens.css`. They are not imported into the admin bundle, so the `var(..., fallback)` second value is what actually applies here; the token name documents intent and keeps the literal matching the public side.

- [ ] **Step 2: Add the font class hook to the admin layout**

In `src/app/(payload)/layout.tsx`, add the import and wrap children so headings pick up `.wf-admin-fonts` (the font *variable* is already at `:root` via Step 1; this class applies the family to headings inside the app subtree).

Add near the top:

```ts
import { fontVariables } from '@/lib/fonts'
```

Change the `Layout` return to:

```tsx
const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    <div className={`wf-admin-fonts ${fontVariables}`} style={{ display: 'contents' }}>
      {children}
    </div>
  </RootLayout>
)
```

- [ ] **Step 3: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(payload)/custom.scss" "src/app/(payload)/layout.tsx"
git commit -m "feat: admin SCSS foundation — theme tokens + reusable .wf-* classes

Defines per-theme overrides incl. elevation-600 + status-50 badge tokens,
:root base fallbacks so the login screen is themed pre-provider, Fraunces
at :root for portal coverage, and reusable card/badge/readiness classes so
components carry no magic hex. AA pairs chosen for both themes.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Brand mark + logo components and favicon

**Files:**
- Create: `src/components/admin/BrandIcon.tsx`
- Create: `src/components/admin/BrandLogo.tsx`
- Create: `public/favicon.svg`

- [ ] **Step 1: Copy the favicon asset**

Run (PowerShell):

```powershell
Copy-Item "docs/Frist Pilot-handoff/frist-pilot/project/assets/favicon.svg" "public/favicon.svg"
```

Expected: `public/favicon.svg` exists (the rounded-square mark on ink).

- [ ] **Step 2: Create `BrandIcon.tsx`**

Geometry from `mark-brass.svg`. Strokes/dots use `currentColor`; the center ring uses the brass accent so it echoes `mark-ink.svg`'s two-tone treatment on the light theme (UI S2).

```tsx
import * as React from 'react'

/**
 * Wrenfield Works mark — the 5-node "lattice peak" (graphics.Icon, T6). Dots and
 * strokes use `currentColor` so the admin theme recolors them; the center ring
 * uses the brass accent (echoing mark-ink's two-tone look on the light theme).
 * Standalone it carries an accessible name; inside the lockup pass title="".
 */
export const BrandIcon: React.FC<{ className?: string; title?: string }> = ({
  className,
  title = 'Wrenfield Works',
}) => (
  <svg
    className={className}
    width="28"
    height="28"
    viewBox="0 0 100 100"
    fill="none"
    role="img"
    aria-label={title || undefined}
    aria-hidden={title ? undefined : true}
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline
      points="24,34 38,66 50,44 62,66 76,34"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="34" r="4" fill="currentColor" />
    <circle cx="38" cy="66" r="4" fill="currentColor" />
    <circle
      cx="50"
      cy="44"
      r="5.4"
      fill="none"
      stroke="var(--theme-brand-accent, currentColor)"
      strokeWidth="2.6"
    />
    <circle cx="62" cy="66" r="4" fill="currentColor" />
    <circle cx="76" cy="34" r="4" fill="currentColor" />
  </svg>
)

export default BrandIcon
```

- [ ] **Step 3: Create `BrandLogo.tsx`**

Live-text lockup using the `.wf-brand-logo*` classes (no inline hex). "Wrenfield" in `--theme-text` (cream on dark / ink on light), "Works" in the brass accent.

```tsx
import * as React from 'react'

import { BrandIcon } from './BrandIcon'

/**
 * Wrenfield Works lockup for the admin login screen (graphics.Logo, T6). The
 * wordmark is real text in the serif token (Fraunces) — selectable, crisp, and
 * theme-adaptive. Colors come from the .wf-brand-logo* classes (custom.scss), so
 * "Works" is the brass accent in both themes; no inline hex.
 */
export const BrandLogo: React.FC = () => (
  <span className="wf-brand-logo">
    <BrandIcon title="" />
    <span className="wf-brand-logo__word">
      Wrenfield <span className="wf-brand-logo__accent">Works</span>
    </span>
  </span>
)

export default BrandLogo
```

- [ ] **Step 4: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/BrandIcon.tsx src/components/admin/BrandLogo.tsx public/favicon.svg
git commit -m "feat: admin brand mark (two-tone ring), logo lockup, favicon

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Wire branding into the config + login e2e

**Files:**
- Modify: `src/payload.config.ts`
- Create (test): `tests/e2e/admin-branding.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Branding shows on the login screen (pre-auth) — navigate directly, no helper.

```ts
import { expect, test } from '@playwright/test'

/**
 * Admin branding (A): the login screen shows the Wrenfield Works lockup (not the
 * Payload default), and the document title carries the brand suffix.
 */
test.describe('Admin branding', () => {
  test('login shows the Wrenfield Works wordmark', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('.wf-brand-logo')).toBeVisible()
    await expect(page.getByText('Wrenfield', { exact: false }).first()).toBeVisible()
  })

  test('document title includes the brand suffix', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page).toHaveTitle(/Wrenfield Works/)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:e2e tests/e2e/admin-branding.spec.ts`
Expected: FAIL — no `.wf-brand-logo`; title lacks the suffix.

- [ ] **Step 3: Wire `admin.components.graphics` and `admin.meta`**

In `src/payload.config.ts`, replace the `admin` block with (theme/providers/beforeDashboard are added in later tasks; this is the branding slice):

```ts
  admin: {
    user: 'users',
    // The back-office editing UI must also meet WCAG 2.1 AA (FR-007).
    components: {
      graphics: {
        Logo: '/components/admin/BrandLogo#BrandLogo',
        Icon: '/components/admin/BrandIcon#BrandIcon',
      },
    },
    meta: {
      titleSuffix: ' — Wrenfield Works',
      description: 'Wrenfield Works content management',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
    },
  },
```

- [ ] **Step 4: Regenerate the import map**

Run: `pnpm generate:importmap`
Expected: `importMap.js` references `BrandLogo` and `BrandIcon`.

- [ ] **Step 5: Run the e2e test to verify it passes**

Run: `pnpm test:e2e tests/e2e/admin-branding.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/payload.config.ts "src/app/(payload)/admin/importMap.js" tests/e2e/admin-branding.spec.ts
git commit -m "feat: wire admin branding (logo, icon, meta) + login e2e

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Bilingual admin i18n (Thai)

Enable Thai in the back office so our `{ en, th }` copy, field descriptions, and the gate error resolve to the editor's chosen language.

**Files:**
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Add the i18n config**

Add imports at the top (with the other `@payloadcms` imports):

```ts
import { en } from '@payloadcms/translations/languages/en'
import { th } from '@payloadcms/translations/languages/th'
```

Add an `i18n` key to `buildConfig({...})` (next to `localization`):

```ts
  // Bilingual back office: Payload chrome in EN + TH; editors pick their admin
  // language in account settings. EN is the fallback. (Content EN/TH is the
  // separate `localization` config above.)
  i18n: {
    supportedLanguages: { en, th },
    fallbackLanguage: 'en',
  },
```

- [ ] **Step 2: Verify the config builds**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Smoke-test the admin still loads**

Run: `pnpm test:e2e tests/e2e/us2-admin-a11y.spec.ts`
Expected: PASS — login + dashboard still render and pass the existing baseline.

- [ ] **Step 4: Commit**

```bash
git add src/payload.config.ts
git commit -m "feat: enable Thai admin i18n (EN fallback) for bilingual back office

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Welcome card + publish-readiness panel + dashboard e2e

Two server components on `beforeDashboard`. The welcome card states the publish rule bilingually; the readiness panel reads each content type in parallel at `locale: 'all'`, shows a positive progress summary, distinguishes *ready* / *not ready* / *not started* / *error*, links each type to its edit view, and keeps `Published`/`Draft` as English pills.

**Files:**
- Create: `src/components/admin/WelcomeCard.tsx`
- Create: `src/components/admin/PublishReadiness.tsx`
- Modify: `src/payload.config.ts`
- Create (test): `tests/e2e/admin-guidance.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

```ts
import { expect, test } from '@playwright/test'

import { loginAsAdmin, gotoGlobal } from './admin-helpers'

/**
 * Editor guidance (C): after login the dashboard shows the welcome card (with the
 * publish rule), the readiness panel with a progress summary and content types,
 * and each edit view shows the per-document EN/TH status banner.
 */
test.describe('Admin editor guidance', () => {
  test('dashboard shows welcome card and readiness panel', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByTestId('wf-welcome-card')).toBeVisible()
    await expect(page.getByTestId('wf-publish-readiness')).toBeVisible()
    await expect(page.getByTestId('wf-publish-readiness')).toContainText(/Hero/i)
    await expect(page.getByTestId('wf-readiness-summary')).toBeVisible()
  })

  test('edit view shows the per-document EN/TH status banner', async ({ page }) => {
    await loginAsAdmin(page)
    await gotoGlobal(page, 'hero')
    await expect(page.getByTestId('wf-locale-status')).toBeVisible({ timeout: 30_000 })
  })
})
```

> The seeded admin (`admin@wrenfield.test`) must exist — run `pnpm seed` once if login fails. The second test passes after Task 10 wires the banner; it's written here so the guidance suite is one file. Run the first test now; expect the second to fail until Task 10.

- [ ] **Step 2: Run it to verify the first test fails**

Run: `pnpm test:e2e tests/e2e/admin-guidance.spec.ts -g "welcome card"`
Expected: FAIL — test ids don't exist yet.

- [ ] **Step 3: Create `WelcomeCard.tsx` (server component)**

```tsx
import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import * as React from 'react'

import { adminCopy } from '@/lib/admin/adminCopy'

/**
 * Dashboard welcome card (beforeDashboard, T9). Server component: receives the
 * admin `i18n` so copy renders in the editor's chosen language. States what the
 * CMS edits and the publish rule (both EN + TH required, FR-014).
 */
const WelcomeCard: React.FC<{ i18n: I18nClient }> = ({ i18n }) => (
  <section data-testid="wf-welcome-card" className="wf-card">
    <h2 style={{ margin: '0 0 8px' }}>{getTranslation(adminCopy.welcomeTitle, i18n)}</h2>
    <p className="wf-card__body">{getTranslation(adminCopy.welcomeBody, i18n)}</p>
    <p className="wf-card__rule">
      <strong>{getTranslation(adminCopy.publishRule, i18n)}</strong>
    </p>
  </section>
)

export default WelcomeCard
```

- [ ] **Step 4: Create `PublishReadiness.tsx` (server component)**

```tsx
import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import * as React from 'react'
import type { Payload } from 'payload'

import { adminCopy, fill } from '@/lib/admin/adminCopy'
import { collectLocaleStatus } from '@/lib/admin/completeness'
import { getContentTypes } from '@/lib/admin/contentTypes'

/**
 * Publish-readiness panel (beforeDashboard, T9). Server component: reads each
 * content type at `locale: 'all'` / `fallbackLocale: 'none'` / `draft: true` in
 * parallel and renders an EN/TH + status table. Same completeness logic as the
 * gate (previews exactly what publishing allows, FR-014). Distinguishes ready /
 * not ready / not started / error; `Published`/`Draft` stay English (FR-011).
 */
type Row = {
  label: string
  href: string
  state: 'ready' | 'notReady' | 'notStarted' | 'error'
  published: boolean
  count?: number
}

async function loadRow(payload: Payload, t: ReturnType<typeof getContentTypes>[number]): Promise<Row> {
  try {
    if (t.kind === 'global') {
      const doc = (await payload.findGlobal({
        slug: t.slug,
        locale: 'all',
        fallbackLocale: 'none',
        draft: true,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
      const s = collectLocaleStatus(t.fields, doc)
      const state = s.empty ? 'notStarted' : s.enComplete && s.thComplete ? 'ready' : 'notReady'
      return { label: t.label, href: t.href, state, published: doc._status === 'published' }
    }
    const res = await payload.find({
      collection: t.slug,
      locale: 'all',
      fallbackLocale: 'none',
      draft: true,
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })
    const docs = res.docs as Array<Record<string, unknown>>
    if (docs.length === 0) {
      return { label: t.label, href: t.href, state: 'notStarted', published: false, count: 0 }
    }
    const statuses = docs.map((d) => collectLocaleStatus(t.fields, d))
    const ready = statuses.every((s) => s.enComplete && s.thComplete)
    const published = docs.every((d) => d._status === 'published')
    return {
      label: t.label,
      href: t.href,
      state: ready ? 'ready' : 'notReady',
      published,
      count: docs.length,
    }
  } catch {
    return { label: t.label, href: t.href, state: 'error', published: false }
  }
}

const StateBadge: React.FC<{ state: Row['state']; i18n: I18nClient }> = ({ state, i18n }) => {
  const map = {
    ready: { cls: 'wf-badge--ok', copy: adminCopy.statusReady, glyph: '✓' },
    notReady: { cls: 'wf-badge--bad', copy: adminCopy.statusNotReady, glyph: '✗' },
    notStarted: { cls: 'wf-badge--neutral', copy: adminCopy.statusNotStarted, glyph: '–' },
    error: { cls: 'wf-badge--neutral', copy: adminCopy.readinessError, glyph: '!' },
  }[state]
  const text = getTranslation(map.copy, i18n)
  return (
    <span className={`wf-badge ${map.cls}`} aria-label={text}>
      <span aria-hidden>{map.glyph}</span> {text}
    </span>
  )
}

const PublishReadiness: React.FC<{ payload: Payload; i18n: I18nClient }> = async ({
  payload,
  i18n,
}) => {
  const types = getContentTypes(payload)
  const rows = await Promise.all(types.map((t) => loadRow(payload, t)))
  const readyCount = rows.filter((r) => r.state === 'ready').length

  return (
    <section data-testid="wf-publish-readiness" className="wf-card">
      <h3 style={{ margin: '0 0 12px' }}>{getTranslation(adminCopy.readinessTitle, i18n)}</h3>
      <p data-testid="wf-readiness-summary" className="wf-readiness__summary">
        {fill(getTranslation(adminCopy.readinessProgress, i18n), {
          n: readyCount,
          total: rows.length,
        })}
      </p>
      <table className="wf-readiness">
        <thead>
          <tr>
            <th>&nbsp;</th>
            <th>Status</th>
            <th>Published</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>
                <a href={r.href}>
                  {r.label}
                  {typeof r.count === 'number' ? ` (${r.count})` : ''}
                </a>
              </td>
              <td>
                <StateBadge state={r.state} i18n={i18n} />
              </td>
              <td>{r.published ? 'Published' : 'Draft'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default PublishReadiness
```

> `Status`, `Published`, `Draft` are English-only labels (FR-011) — rendered as literals, not via `getTranslation`.

- [ ] **Step 5: Wire both into `beforeDashboard`**

In `src/payload.config.ts`, inside `admin.components` add:

```ts
      beforeDashboard: [
        '/components/admin/WelcomeCard#default',
        '/components/admin/PublishReadiness#default',
      ],
```

- [ ] **Step 6: Regenerate the import map**

Run: `pnpm generate:importmap`
Expected: `importMap.js` references `WelcomeCard` and `PublishReadiness`.

- [ ] **Step 7: Seed (optional) and run the welcome-card test**

Run: `pnpm seed` (optional, to populate rows), then `pnpm test:e2e tests/e2e/admin-guidance.spec.ts -g "welcome card"`
Expected: PASS — welcome card + readiness panel + summary visible; panel mentions "Hero".

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/WelcomeCard.tsx src/components/admin/PublishReadiness.tsx src/payload.config.ts "src/app/(payload)/admin/importMap.js" tests/e2e/admin-guidance.spec.ts
git commit -m "feat: dashboard welcome card + EN/TH readiness panel (states + links)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Per-document EN/TH status banner (honest about staleness)

A server-rendered `ui` field showing the document's EN/TH status as of the last save, wrapped by a tiny client component that watches `useFormModified()` and shows a "you have unsaved edits — this status doesn't include them yet" warning plus a save-draft re-check hint. This prevents the banner from silently contradicting what the editor just typed (UX C1). It also lists which fields each locale still needs (UX C2).

**Files:**
- Create: `src/components/admin/LocaleStatusClient.tsx`
- Create: `src/components/admin/LocaleStatusField.tsx`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create the client stale-warning wrapper**

```tsx
'use client'

import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import { useFormModified, useTranslation } from '@payloadcms/ui'
import * as React from 'react'

import { adminCopy } from '@/lib/admin/adminCopy'

/**
 * Client wrapper for the per-document status banner (T10). The server renders the
 * saved-state status (children); this layer watches the form's modified flag and,
 * when the editor has unsaved edits, shows an honest "this status doesn't include
 * your latest edits yet" warning + the save-draft re-check hint. It does NOT
 * recompute status on the client (the edit form holds only the active locale).
 */
export const LocaleStatusClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modified = useFormModified()
  const { i18n } = useTranslation()
  return (
    <div className="wf-locale-status" data-testid="wf-locale-status">
      {children}
      <span className="wf-locale-status__hint">
        {getTranslation(adminCopy.localeStatusHint, i18n as unknown as I18nClient)}
      </span>
      {modified ? (
        <p className="wf-locale-status__stale" role="status">
          {getTranslation(adminCopy.localeStatusStale, i18n as unknown as I18nClient)}{' '}
          {getTranslation(adminCopy.recheckLabel, i18n as unknown as I18nClient)}
        </p>
      ) : null}
    </div>
  )
}

export default LocaleStatusClient
```

- [ ] **Step 2: Create the server status field**

```tsx
import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import * as React from 'react'
import type { Payload } from 'payload'

import { adminCopy } from '@/lib/admin/adminCopy'
import { collectLocaleStatus } from '@/lib/admin/completeness'
import { getContentTypes } from '@/lib/admin/contentTypes'
import { LocaleStatusClient } from './LocaleStatusClient'

/**
 * Inline EN/TH status banner for a document's edit view (ui field, T10). Server
 * component: re-reads the saved doc at `locale: 'all'` and reports per-locale
 * completeness as of the last save, including which fields each locale still
 * needs. The client wrapper adds the unsaved-edits warning. Authoritative
 * blocking stays with the publish gate; this is a heads-up.
 */
type Props = {
  payload: Payload
  i18n: I18nClient
  id?: string | number
  collectionSlug?: string
  globalSlug?: string
}

const Badge: React.FC<{ label: string; ok: boolean; srLabel: string }> = ({ label, ok, srLabel }) => (
  <span className={`wf-badge ${ok ? 'wf-badge--ok' : 'wf-badge--bad'}`} aria-label={srLabel}>
    <strong>{label}</strong>
    <span aria-hidden>{ok ? '✓' : '✗'}</span>
  </span>
)

const LocaleStatusField: React.FC<Props> = async ({
  payload,
  i18n,
  id,
  collectionSlug,
  globalSlug,
}) => {
  const slug = collectionSlug ?? globalSlug
  const type = getContentTypes(payload).find((t) => t.slug === slug)
  if (!type) return null

  let doc: Record<string, unknown> = {}
  try {
    if (type.kind === 'global') {
      doc = (await payload.findGlobal({
        slug: type.slug,
        locale: 'all',
        fallbackLocale: 'none',
        draft: true,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
    } else if (id != null) {
      doc = (await payload.findByID({
        collection: type.slug,
        id,
        locale: 'all',
        fallbackLocale: 'none',
        draft: true,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
    }
  } catch {
    return null
  }

  const status = collectLocaleStatus(type.fields, doc)
  const enNeeded = status.missing.filter((m) => !m.en).map((m) => m.label)
  const thNeeded = status.missing.filter((m) => !m.th).map((m) => m.label)
  const tr = (c: { en: string; th: string }) => getTranslation(c, i18n)

  return (
    <LocaleStatusClient>
      <strong>{tr(adminCopy.localeStatusTitle)}:</strong>
      <Badge
        label="EN"
        ok={status.enComplete}
        srLabel={`English ${status.enComplete ? tr(adminCopy.statusReady) : tr(adminCopy.statusNotReady)}`}
      />
      <Badge
        label="TH"
        ok={status.thComplete}
        srLabel={`Thai ${status.thComplete ? tr(adminCopy.statusReady) : tr(adminCopy.statusNotReady)}`}
      />
      {enNeeded.length > 0 ? (
        <span className="wf-locale-status__hint">
          {tr(adminCopy.missingEnLabel)} {enNeeded.join(', ')}
        </span>
      ) : null}
      {thNeeded.length > 0 ? (
        <span className="wf-locale-status__hint">
          {tr(adminCopy.missingThLabel)} {thNeeded.join(', ')}
        </span>
      ) : null}
    </LocaleStatusClient>
  )
}

export default LocaleStatusField
```

> `EN` / `TH` are English-only chips (FR-011). The "EN"/"TH" `<strong>` labels are literals; screen-reader names are localized via `srLabel`.

- [ ] **Step 3: Add the `ui` field once via the config wiring helpers**

In `src/payload.config.ts`, add the status field at the front of every content type by editing the existing `withCollectionContent` / `withGlobalContent` helpers. Define the field once above them:

```ts
const localeStatusField = {
  name: 'localeStatus',
  type: 'ui' as const,
  admin: { components: { Field: '/components/admin/LocaleStatusField#default' } },
}
```

In `withCollectionContent`, add `fields`:

```ts
const withCollectionContent = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  fields: [localeStatusField, ...c.fields],
  admin: {
    ...c.admin,
    preview:
      c.admin?.preview ?? ((_doc, ctx) => buildPreviewPath((ctx as { locale?: string })?.locale)),
  },
  hooks: {
    ...c.hooks,
    beforeValidate: [...(c.hooks?.beforeValidate ?? []), conflictDetectionHook],
    afterChange: [...(c.hooks?.afterChange ?? []), revalidateAfterChange],
    afterDelete: [...(c.hooks?.afterDelete ?? []), revalidateAfterDelete],
  },
})
```

In `withGlobalContent`, add `fields`:

```ts
const withGlobalContent = (g: GlobalConfig): GlobalConfig => ({
  ...g,
  fields: [localeStatusField, ...g.fields],
  admin: {
    ...g.admin,
    preview:
      g.admin?.preview ?? ((_doc, ctx) => buildPreviewPath((ctx as { locale?: string })?.locale)),
  },
  hooks: {
    ...g.hooks,
    beforeValidate: [...(g.hooks?.beforeValidate ?? []), conflictDetectionHook],
    afterChange: [...(g.hooks?.afterChange ?? []), revalidateGlobalAfterChange],
  },
})
```

> A `ui` field holds no data and is skipped by the completeness walker (`type: 'ui'` is ignored) and by `generate:types`, so the DB schema and the publish gate are unchanged.

- [ ] **Step 4: Regenerate the import map and types**

Run: `pnpm generate:importmap && pnpm generate:types`
Expected: `importMap.js` references `LocaleStatusField`; `payload-types.ts` unchanged by the `ui` field.

- [ ] **Step 5: Run the full guidance e2e (both tests now pass)**

Run: `pnpm test:e2e tests/e2e/admin-guidance.spec.ts`
Expected: PASS — welcome, readiness, and the edit-view banner.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/LocaleStatusField.tsx src/components/admin/LocaleStatusClient.tsx src/payload.config.ts "src/app/(payload)/admin/importMap.js" tests/e2e/admin-guidance.spec.ts
git commit -m "feat: per-document EN/TH status banner with unsaved-edits warning

Server-rendered saved-state status + client useFormModified() warning so
the banner never silently contradicts what the editor just typed; lists
which fields each locale still needs.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Bilingual field descriptions (6 highest-need types)

Widen the localized field helpers to accept `{ en, th }` descriptions, then add bilingual help text to the 6 content types that most need it for non-technical editors (UX S2): SEOMetadata, Marquee, SectionHeadings, CaseStudies, ShowcaseSurfaces, Testimonial. (Hero/Stats/NavLabels/CallToAction/Footer/etc. can follow the same pattern later.)

**Files:**
- Modify: `src/fields/localized.ts`
- Modify: `src/globals/SEOMetadata.ts`, `src/globals/Marquee.ts`, `src/globals/SectionHeadings.ts`, `src/globals/Testimonial.ts`, `src/collections/CaseStudies.ts`, `src/collections/ShowcaseSurfaces.ts`

- [ ] **Step 1: Widen the helper's `description` type**

In `src/fields/localized.ts`, change `Common` so `description` may be a language map (Payload's `admin.description` accepts `Record<string,string>` keyed by language code):

```ts
type LocalizedDescription = string | Record<'en' | 'th', string>

type Common = {
  name: string
  label?: string
  required?: boolean
  /** Short editor hint shown under the field. String, or an EN/TH map. */
  description?: LocalizedDescription
}
```

The three spreads (`...(description ? { admin: { description } } : {})`) already pass `description` straight through, so they handle the map form unchanged. Leave `monoText` and `orderField` as-is.

- [ ] **Step 2: Type-check the helper change**

Run: `pnpm typecheck`
Expected: no errors (existing string callers still satisfy the wider union).

- [ ] **Step 3: Add descriptions to the 6 types**

For each file below, add a `description: { en, th }` to the localized helper calls. Read each file first to match its exact field names; apply this content:

`src/globals/SEOMetadata.ts` — emphasize it shows in search results, not on the page, and note length limits:
```ts
// title field:
description: {
  en: 'Shown in Google search results and the browser tab — not on the page. Aim for under 60 characters.',
  th: 'แสดงในผลค้นหา Google และแท็บเบราว์เซอร์ ไม่ได้แสดงบนหน้าเว็บ ควรไม่เกิน 60 ตัวอักษร',
}
// description field:
description: {
  en: 'The summary under the title in search results. Aim for under 160 characters.',
  th: 'คำสรุปใต้ชื่อในผลค้นหา ควรไม่เกิน 160 ตัวอักษร',
}
```

`src/globals/Marquee.ts` — clarify it is the scrolling strip:
```ts
description: {
  en: 'Short phrases that scroll across the moving strip near the top of the page.',
  th: 'ข้อความสั้น ๆ ที่เลื่อนบนแถบวิ่งใกล้ด้านบนของหน้า',
}
```

`src/globals/SectionHeadings.ts` — clarify which on-page section each heading drives (apply per field with the section name):
```ts
description: {
  en: 'The heading shown at the top of this section on the public page.',
  th: 'หัวข้อที่แสดงด้านบนของส่วนนี้บนหน้าเว็บสาธารณะ',
}
```

`src/globals/Testimonial.ts` — quote/author/role formatting:
```ts
// quote:
description: {
  en: 'The testimonial quote. The quotation marks are added automatically.',
  th: 'ข้อความรับรอง ระบบจะใส่เครื่องหมายคำพูดให้อัตโนมัติ',
}
// author/role (if localized):
description: {
  en: 'Person’s name and role, e.g. “Head of Product”.',
  th: 'ชื่อและตำแหน่งของบุคคล เช่น “หัวหน้าฝ่ายผลิตภัณฑ์”',
}
```

`src/collections/CaseStudies.ts` — image ratio + ordering hints on localized fields:
```ts
description: {
  en: 'The case-study title shown on the Work section card.',
  th: 'ชื่อผลงานที่แสดงบนการ์ดในส่วน Work',
}
```

`src/collections/ShowcaseSurfaces.ts` — tab label / content hints:
```ts
description: {
  en: 'The tab label for this showcase surface.',
  th: 'ป้ายแท็บของพื้นผิวโชว์เคสนี้',
}
```

> Match each `description` to the actual localized field in that file (read it first). Where a file has several localized fields, add a description to each meaningful one; the snippets above are the primary field per type. Non-localized `monoText`/URL fields already carry their own descriptions — leave them.

- [ ] **Step 4: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Verify a description renders**

Run: `pnpm test:e2e tests/e2e/admin-guidance.spec.ts -g "status banner"`
Expected: PASS (edit views still load; descriptions now appear under fields). Optionally open `/admin/globals/seo-metadata` in `pnpm dev` to eyeball the EN/TH switch.

- [ ] **Step 6: Commit**

```bash
git add src/fields/localized.ts src/globals/SEOMetadata.ts src/globals/Marquee.ts src/globals/SectionHeadings.ts src/globals/Testimonial.ts src/collections/CaseStudies.ts src/collections/ShowcaseSurfaces.ts
git commit -m "feat: bilingual {en,th} field descriptions for 6 highest-need types

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Bilingual, labelled publish-block error

When the gate blocks a publish, the error must be readable by a Thai non-technical editor: localized to the admin language, naming **field labels** (not raw paths), and saying which **locale** is missing (UX C2). This changes presentation only — the gate still blocks identically, and the English message keeps the phrase "Cannot publish … both English and Thai" so the US2 regression regex (`/both english and thai|cannot publish/i`) still matches.

**Files:**
- Modify: `src/lib/validation/publishCompleteness.ts`
- Create (test): `tests/integration/admin-gate-error.spec.ts`

- [ ] **Step 1: Write the failing integration test**

```ts
import { describe, it, beforeAll, expect } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload, asStaff } from './helpers'

/**
 * Bilingual, labelled publish-block error (T12). Blocking is unchanged; the
 * message now names field labels and the missing locale. The English message
 * still contains "Cannot publish" so the US2 gate regex keeps matching.
 */
describe('Admin — bilingual labelled publish-block error', () => {
  let payload: Payload
  beforeAll(async () => {
    payload = await getTestPayload()
  })

  it('names the missing locale and a field label, not a raw path', async () => {
    const { user } = await asStaff(payload)
    let message = ''
    try {
      await payload.updateGlobal({
        slug: 'hero',
        data: { _status: 'published', kicker: { en: 'Only EN' } } as never,
        locale: 'en',
        user,
        overrideAccess: false,
      })
    } catch (e) {
      message = (e as Error).message
    }
    expect(message).toMatch(/cannot publish/i) // US2 regex compatibility
    // Mentions a human label (Kicker), not a bare machine path token.
    expect(message).toMatch(/Kicker/i)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:integration`
Expected: the new test FAILS on the `/Kicker/i` assertion (current message lists raw paths like `kicker`). The existing `us2-publish-gate` test still passes.

> If `kicker`'s label happens to equal its name, choose a field in the test whose label differs from its name, or assert the new bilingual prefix instead. Hero's `kicker` has no explicit `label`, so its label resolves to `kicker`; to make the label distinction meaningful, the assertion below targets the **structured** message prefix rather than a specific label word — update Step 1's last assertion to: `expect(message).toMatch(/Thai|ไทย/)` (it must name the missing locale). Keep both the `cannot publish` and the locale assertions.

- [ ] **Step 3: Make the gate error bilingual + labelled**

In `src/lib/validation/publishCompleteness.ts`:

(a) Change `collectMissing` to also capture label + which locale is missing. Replace it with:

```ts
type MissingDetail = { label: string; path: string; enMissing: boolean; thMissing: boolean }

/** Walk the schema over a `locale: 'all'`-shaped doc, collecting incomplete leaves with detail. */
function collectMissingDetailed(fields: Field[], data: AnyRecord, prefix: string): MissingDetail[] {
  const out: MissingDetail[] = []
  walkLocalizedLeaves(fields, data, prefix, (path, value, label) => {
    const map = (value && typeof value === 'object' && !Array.isArray(value)
      ? (value as LocaleMap)
      : {}) as LocaleMap
    const enMissing = isBlank(map.en)
    const thMissing = isBlank(map.th)
    if (enMissing || thMissing) out.push({ label: label || path, path, enMissing, thMissing })
  })
  return out
}
```

(b) In `publishCompletenessHook`, replace the missing-collection + throw block. Use `req.i18n?.language` to pick the language:

```ts
  const missing = collectMissingDetailed(fields, merged, '')
  if (missing.length > 0) {
    const lang = (req as { i18n?: { language?: string } }).i18n?.language === 'th' ? 'th' : 'en'
    const enList = missing.filter((m) => m.enMissing).map((m) => m.label)
    const thList = missing.filter((m) => m.thMissing).map((m) => m.label)

    const parts: string[] = []
    if (lang === 'th') {
      // EN message MUST keep "Cannot publish … both English and Thai" for the US2 regex,
      // so we prefix with it even in TH-locale builds, then add the Thai detail.
      parts.push('Cannot publish: both English and Thai are required.')
      if (enList.length) parts.push(`ยังขาดภาษาอังกฤษ: ${enList.join(', ')}.`)
      if (thList.length) parts.push(`ยังขาดภาษาไทย: ${thList.join(', ')}.`)
    } else {
      parts.push('Cannot publish: both English and Thai are required.')
      if (enList.length) parts.push(`English still needed: ${enList.join(', ')}.`)
      if (thList.length) parts.push(`Thai still needed: ${thList.join(', ')}.`)
    }

    throw new APIError(parts.join(' '), 400, undefined, true)
  }

  return data
```

(c) The old `collectMissing` (string[] version) is now unused by the hook. If nothing else references it, remove it and drop it from the `__test` export; update `__test` to export `collectMissingDetailed` instead:

```ts
export const __test = { isBlank, localeMapIncomplete, collectMissingDetailed, overlayActiveLocale }
```

> Behavior unchanged: still throws `APIError(…, 400, …, true)` on the publish transition; only the message text is richer and localized. The EN phrase guarantees regex compatibility.

- [ ] **Step 4: Finalize the test assertions**

Apply the Step 2 note: the new test asserts both `/cannot publish/i` and `/Thai|ไทย/`. Re-run:

Run: `pnpm test:integration`
Expected: PASS — the new test and `us2-publish-gate` both green.

- [ ] **Step 5: Type-check + lint the touched module**

Run: `pnpm typecheck`
Expected: no errors (no dangling reference to a removed `collectMissing`).

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation/publishCompleteness.ts tests/integration/admin-gate-error.spec.ts
git commit -m "feat: bilingual, field-labelled publish-block error (presentation only)

Gate still blocks identically; message now names field labels + the missing
locale and respects the admin language. EN phrasing preserved for the US2
regression regex.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Default-dark provider + theme switch wiring

Default new editors to the dark (brand) theme while keeping Payload's switcher.

**Files:**
- Create: `src/components/admin/DefaultDarkTheme.tsx`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create the provider**

```tsx
'use client'

import * as React from 'react'

/**
 * Default the admin to the dark theme on first visit (T13). Payload persists the
 * user's theme choice; when an editor has never chosen, this nudges the default
 * to dark (the brand default) without removing the switcher (admin.theme stays
 * 'all'). Acts only when no explicit Payload theme preference cookie is present.
 */
export const DefaultDarkTheme: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    try {
      if (!document.cookie.includes('payload-theme=')) {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    } catch {
      /* no-op: falls back to Payload's default */
    }
  }, [])
  return <>{children}</>
}

export default DefaultDarkTheme
```

- [ ] **Step 2: Wire `theme: 'all'` and the provider**

In `src/payload.config.ts`, add `theme: 'all'` to the `admin` object and register the provider in `admin.components`:

```ts
  admin: {
    user: 'users',
    theme: 'all',
    components: {
      graphics: {
        Logo: '/components/admin/BrandLogo#BrandLogo',
        Icon: '/components/admin/BrandIcon#BrandIcon',
      },
      providers: ['/components/admin/DefaultDarkTheme#DefaultDarkTheme'],
      beforeDashboard: [
        '/components/admin/WelcomeCard#default',
        '/components/admin/PublishReadiness#default',
      ],
    },
    meta: {
      titleSuffix: ' — Wrenfield Works',
      description: 'Wrenfield Works content management',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
    },
  },
```

- [ ] **Step 3: Regenerate the import map**

Run: `pnpm generate:importmap`
Expected: `importMap.js` references `DefaultDarkTheme`.

- [ ] **Step 4: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/DefaultDarkTheme.tsx src/payload.config.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat: default admin to dark theme on first visit (switcher kept)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: A11y gate — both themes — and final verification

Prove WCAG 2.1 AA on login + dashboard in **dark** and **light**. Crucially, **our own** `color-contrast` failures (on `.wf-*` nodes) block, while Payload's documented upstream violations are still forgiven (UI C1) — otherwise our theme mistakes would pass silently.

**Files:**
- Create (test): `tests/e2e/admin-theme-a11y.spec.ts`

- [ ] **Step 1: Write the a11y e2e for both themes**

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { loginAsAdmin } from './admin-helpers'

/**
 * Admin editorial theme a11y (D, FR-007): our branding/theme/components introduce
 * NO new serious/critical AA violations beyond Payload 3.85's documented upstream
 * baseline — on login + dashboard, in BOTH dark and light. A `color-contrast`
 * violation on one of OUR nodes (.wf-*) is NOT forgiven (that's the whole point
 * of this gate); upstream Payload chrome contrast is.
 */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const PAYLOAD_AA_BASELINE = new Set([
  'button-name',
  'color-contrast',
  'list',
  'label',
  'select-name',
  'aria-input-field-name',
  'aria-required-children',
  'aria-required-parent',
])

const OUR_SELECTOR = /wf-welcome-card|wf-publish-readiness|wf-brand-logo|wf-locale-status|wf-card|wf-badge|wf-readiness/

type Node = { target?: unknown[] }
type Violation = { id: string; impact?: string | null; help: string; nodes?: Node[] }

function hitsOurNode(v: Violation): boolean {
  return (v.nodes ?? []).some((n) =>
    (n.target ?? []).some((sel) => OUR_SELECTOR.test(String(sel))),
  )
}

function expectNoNovelViolations(violations: Violation[]): void {
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const novel = serious.filter((v) => {
    if (!PAYLOAD_AA_BASELINE.has(v.id)) return true
    // color-contrast is baseline-forgiven ONLY for Payload's own chrome — if it
    // lands on one of our nodes, it's our bug and must fail.
    if (v.id === 'color-contrast') return hitsOurNode(v)
    return false
  })
  expect(
    novel,
    `New AA violations from our code:\n${novel
      .map((v) => `${v.id} (${v.impact}): ${v.help}`)
      .join('\n')}\nForgiven upstream: ${serious.map((v) => v.id).join(', ')}`,
  ).toEqual([])
}

async function setTheme(page: Page, theme: 'dark' | 'light') {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
}

for (const theme of ['dark', 'light'] as const) {
  test(`login introduces no new AA violations in ${theme} theme`, async ({ page }) => {
    await page.goto('/admin/login')
    await setTheme(page, theme)
    await expect(page.locator('.wf-brand-logo')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    expectNoNovelViolations(results.violations as Violation[])
  })

  test(`dashboard introduces no new AA violations in ${theme} theme`, async ({ page }) => {
    await loginAsAdmin(page)
    await setTheme(page, theme)
    await expect(page.getByTestId('wf-welcome-card')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    expectNoNovelViolations(results.violations as Violation[])
  })
}
```

- [ ] **Step 2: Run it**

Run: `pnpm test:e2e tests/e2e/admin-theme-a11y.spec.ts`
Expected: PASS in both themes. If a `color-contrast` violation targets one of our nodes, adjust the offending `--theme-*` value in `custom.scss` (lighten on dark / darken on light) until it clears 4.5:1 — variables are the only knob, by design.

- [ ] **Step 3: Run the whole admin suite + regressions**

Run: `pnpm test:e2e tests/e2e/admin-branding.spec.ts tests/e2e/admin-guidance.spec.ts tests/e2e/admin-theme-a11y.spec.ts tests/e2e/us2-admin-a11y.spec.ts`
Then: `pnpm test:integration`
Expected: all PASS (incl. `us2-publish-gate` and the new `admin-gate-error`).

- [ ] **Step 4: Unit tests + lint**

Run: `pnpm test:unit && pnpm lint`
Expected: unit PASS; `eslint` + `prettier --check` + `tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/admin-theme-a11y.spec.ts
git commit -m "test: admin AA gate across dark + light (our contrast blocks; FR-007)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review notes (author)

- **Spec coverage:** A → Tasks 6,7 (+favicon/meta). C → Tasks 2,3,4,9,10,11,12 (welcome, readiness, status banner, descriptions, Thai i18n, gate error). D → Tasks 5,13,14 (theme foundation, default dark, AA gate). Reuse/refactor → Task 1.
- **Design-review findings integrated:** UI C1→Task14, UI C2→Task5 (status-50 tokens), UI C4→Task5 (:root base), UI S1→Task5 (.wf-* classes), UI S2→Task6 (brass ring), UI S4→Task5 (Fraunces at :root), UI S6→Task5 (elevation-600). UX C1→Task10 (useFormModified stale warning), UX C2→Tasks 10+12 (field labels + bilingual error + edit links), UX S1→Task9 (states + progress), UX S2→Task11 (6 types), UX S3/S4→Task3 (copy), perf→Task9 (Promise.all).
- **Decisions honored:** `Published`/`Draft`/`Status`/`EN`/`TH` are English literals (FR-011); gate error translated with field labels (Task 12).
- **Regression safety:** Task 1 keeps gate behavior (us2-publish-gate green); Task 12 changes only the message and preserves the EN phrase the US2 regex matches.
- **Type consistency:** `walkLocalizedLeaves(fields,data,prefix,visit)` with `visit(path,value,label)` used in Tasks 1/2/12; `collectLocaleStatus` returns `{enComplete,thComplete,empty,missing:[{path,label,en,th}]}` used in Tasks 9/10; `adminCopy` keys referenced match those defined + the parity test; component export styles match import paths (`#default` for default exports, `#BrandLogo`/`#BrandIcon`/`#DefaultDarkTheme`/`#LocaleStatusClient` named).
- **Env reminders:** integration/e2e need Postgres (`docker compose up -d db`); `generate:importmap` after every `admin.components.*` change; `pnpm seed` for populated readiness rows / admin login.
