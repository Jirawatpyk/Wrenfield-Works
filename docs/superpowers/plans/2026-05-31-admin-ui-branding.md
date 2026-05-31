# Admin UI: Branding, Editor Guidance & Editorial Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brand the Payload `/admin` back office (logo/favicon/title), add bilingual editor guidance (welcome card, EN/TH publish-readiness indicator, field help), and apply a full editorial theme — dark by default, switchable, WCAG 2.1 AA in both themes.

**Architecture:** Pure logic lives in `src/lib/**` (unit-tested first). The EN/TH readiness logic is extracted from the existing publish gate so the badge and the gate agree by construction. Admin React components (`src/components/admin/`) are thin and registered via `admin.components` in `payload.config.ts`. Theme is applied by overriding Payload's documented CSS theme variables in `src/app/(payload)/custom.scss` — never internal class names — so it survives upgrades. Rendering/visual/a11y is verified with Playwright + axe (vitest runs in a `node` env, so component rendering is e2e-only here).

**Tech Stack:** Next.js 16, React 19, Payload CMS 3.85, TypeScript, Vitest (node env), Playwright + @axe-core/playwright, `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-05-31-admin-ui-branding-design.md`

---

## Conventions for every task

- Run unit tests: `pnpm test tests/unit/<file>.spec.ts`
- Run a single integration test: `pnpm test:integration` (resets the test DB, then runs `tests/integration`)
- Run a single e2e file: `pnpm test:e2e tests/e2e/<file>.spec.ts`
- After schema/config edits that change types: `pnpm generate:types`
- After adding/removing any `admin.components.*` path: `pnpm generate:importmap` (regenerates `src/app/(payload)/admin/importMap.js`)
- Lint before each commit is optional locally (CI enforces `pnpm lint`), but run it on config/TS-heavy tasks.

---

## File structure (created/modified)

```
CREATE  src/lib/validation/localeFields.ts        # shared isBlank + localized-leaf walker
MODIFY  src/lib/validation/publishCompleteness.ts # consume localeFields (behavior unchanged)
CREATE  src/lib/admin/completeness.ts             # per-locale EN/TH status (reuses localeFields)
CREATE  src/lib/admin/adminCopy.ts                # bilingual EN/TH custom strings + types
CREATE  src/lib/admin/contentTypes.ts             # derive content globals/collections from config

CREATE  src/components/admin/BrandIcon.tsx        # mark (currentColor), graphics.Icon
CREATE  src/components/admin/BrandLogo.tsx        # mark + wordmark, graphics.Logo
CREATE  src/components/admin/WelcomeCard.tsx      # beforeDashboard (server, bilingual)
CREATE  src/components/admin/PublishReadiness.tsx # beforeDashboard (server, readiness table)
CREATE  src/components/admin/LocaleStatusField.tsx# ui field (server, this-doc EN/TH status)
CREATE  src/components/admin/DefaultDarkTheme.tsx # providers (default dark on first visit)

MODIFY  src/fields/localized.ts                   # description: string | {en,th}
MODIFY  src/app/(payload)/custom.scss             # editorial theme (variable overrides)
MODIFY  src/app/(payload)/layout.tsx              # wrap children with fontVariables
MODIFY  src/payload.config.ts                     # wire components/meta/theme/i18n + ui field
CREATE  public/favicon.svg                        # brand favicon (copied from handoff)

CREATE  tests/unit/locale-fields.spec.ts
CREATE  tests/unit/completeness.spec.ts
CREATE  tests/unit/admin-copy.spec.ts
CREATE  tests/e2e/admin-branding.spec.ts
CREATE  tests/e2e/admin-guidance.spec.ts
CREATE  tests/e2e/admin-theme-a11y.spec.ts
```

---

## Task 1: Extract the shared localized-leaf walker

Pull `isBlank`, the value-field type set, and the schema walk out of `publishCompleteness.ts` into a reusable module so the readiness badge and the publish gate share one definition of "complete." The gate's public behavior must not change — `tests/integration/us2-publish-gate.spec.ts` is the regression guard.

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
  it('visits every localized value leaf with its {en,th} map and dotted path', () => {
    const fields: Field[] = [
      { name: 'kicker', type: 'text', localized: true },
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
    const seen: Array<{ path: string; value: unknown }> = []
    walkLocalizedLeaves(fields, data, '', (path, value) => seen.push({ path, value }))
    expect(seen).toEqual([
      { path: 'kicker', value: { en: 'A', th: '' } },
      { path: 'rows[0].label', value: { en: 'r0', th: 'r0' } },
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
 * Shared localized-field utilities (T1). The publish-completeness gate
 * (`publishCompleteness.ts`) and the admin readiness badge (`lib/admin/
 * completeness.ts`) both walk a `locale: 'all'`-shaped document the same way, so
 * "what counts as complete" is defined exactly once here.
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

/**
 * Walk the schema over a `locale: 'all'`-shaped doc and invoke `visit(path, value)`
 * for every localized value-field leaf. `value` is the stored leaf (an `{ en, th }`
 * map when present). Descends through row/collapsible, group, named/unnamed tabs,
 * array, and blocks.
 */
export function walkLocalizedLeaves(
  fields: Field[],
  data: AnyRecord,
  prefix: string,
  visit: (path: string, value: unknown) => void,
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
      if (localized) visit(path, value)
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
Expected: PASS (all cases green).

- [ ] **Step 5: Refactor `publishCompleteness.ts` to consume the shared module**

In `src/lib/validation/publishCompleteness.ts`:

(a) Replace the top type/const/`isBlank` block. Delete the local `AnyRecord` type, the local `VALUE_FIELD_TYPES` set, and the local `isBlank` function, and add this import near the other imports:

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

Leave `overlayActiveLocale`, `getFields`, `fetchAllLocales`, `publishCompletenessHook`, and the `__test` export unchanged. `VALUE_FIELD_TYPES` is still referenced inside `overlayActiveLocale`, now via the import.

- [ ] **Step 6: Verify the gate still type-checks and the existing unit test still passes**

Run: `pnpm test tests/unit/locale-fields.spec.ts && pnpm typecheck`
Expected: unit PASS; `tsc --noEmit` reports no errors.

- [ ] **Step 7: Run the publish-gate regression guard (integration)**

Run: `pnpm test:integration`
Expected: PASS — `tests/integration/us2-publish-gate.spec.ts` (and the other US2 integration specs) stay green, proving the extraction didn't change gate behavior.

> If Postgres isn't running locally, start it first: `docker compose up -d db`. The harness points at the `wrenfield_test` DB and pushes schema on connect.

- [ ] **Step 8: Commit**

```bash
git add src/lib/validation/localeFields.ts src/lib/validation/publishCompleteness.ts tests/unit/locale-fields.spec.ts
git commit -m "refactor: extract shared localized-leaf walker (localeFields)

Single source of truth for isBlank + the schema walk, consumed by both
the publish gate and (next) the admin readiness badge. Gate behavior
unchanged — us2-publish-gate integration suite stays green.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Per-locale EN/TH status logic

A pure function that, given a content type's fields and its `locale: 'all'` document, reports which localized paths are missing EN and which are missing TH, plus convenience booleans.

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
  { name: 'kicker', type: 'text', localized: true },
  { name: 'unit', type: 'text' }, // non-localized → ignored
  { name: 'rows', type: 'array', fields: [{ name: 'label', type: 'text', localized: true }] },
]

describe('collectLocaleStatus', () => {
  it('reports both complete when every localized leaf has en and th', () => {
    const doc = {
      kicker: { en: 'Hi', th: 'สวัสดี' },
      unit: { en: 'kg', th: 'kg' },
      rows: [{ label: { en: 'A', th: 'ก' } }],
    }
    const s = collectLocaleStatus(fields, doc)
    expect(s.enMissing).toEqual([])
    expect(s.thMissing).toEqual([])
    expect(s.enComplete).toBe(true)
    expect(s.thComplete).toBe(true)
  })

  it('flags TH gaps when only English is filled', () => {
    const doc = { kicker: { en: 'Hi', th: '' }, rows: [{ label: { en: 'A', th: '' } }] }
    const s = collectLocaleStatus(fields, doc)
    expect(s.enMissing).toEqual([])
    expect(s.thMissing).toEqual(['kicker', 'rows[0].label'])
    expect(s.enComplete).toBe(true)
    expect(s.thComplete).toBe(false)
  })

  it('flags both locales for an empty document', () => {
    const s = collectLocaleStatus(fields, {})
    expect(s.enMissing).toEqual(['kicker'])
    expect(s.thMissing).toEqual(['kicker'])
    expect(s.enComplete).toBe(false)
    expect(s.thComplete).toBe(false)
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

/** Per-locale completeness of one content document (admin readiness badge, T2). */
export type LocaleStatus = {
  /** Localized paths whose English value is blank. */
  enMissing: string[]
  /** Localized paths whose Thai value is blank. */
  thMissing: string[]
  /** True when no English value is missing. */
  enComplete: boolean
  /** True when no Thai value is missing. */
  thComplete: boolean
}

type LocaleMap = { en?: unknown; th?: unknown }

/**
 * Compute per-locale status by walking the schema over a `locale: 'all'`-shaped
 * doc. A localized leaf is `{ en, th }`; a missing map counts as both blank. Uses
 * the same `isBlank` + walker as the publish gate, so the badge can never disagree
 * with what the gate will allow (FR-014).
 */
export function collectLocaleStatus(fields: Field[], doc: AnyRecord): LocaleStatus {
  const enMissing: string[] = []
  const thMissing: string[] = []

  walkLocalizedLeaves(fields, doc, '', (path, value) => {
    const map = (value && typeof value === 'object' && !Array.isArray(value)
      ? (value as LocaleMap)
      : {}) as LocaleMap
    if (isBlank(map.en)) enMissing.push(path)
    if (isBlank(map.th)) thMissing.push(path)
  })

  return {
    enMissing,
    thMissing,
    enComplete: enMissing.length === 0,
    thComplete: thMissing.length === 0,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/completeness.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/completeness.ts tests/unit/completeness.spec.ts
git commit -m "feat: per-locale EN/TH completeness status for admin badge

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Bilingual admin copy + key-parity test

All custom admin strings in one typed module, each as an `{ en, th }` map. A test fails if any key is missing either locale (enforces the i18n gate for our own strings).

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

  it('exposes the keys the welcome card and readiness panel use', () => {
    for (const key of [
      'welcomeTitle',
      'welcomeBody',
      'publishRule',
      'readinessTitle',
      'readinessEn',
      'readinessTh',
      'readinessPublished',
      'readinessDraft',
      'statusComplete',
      'statusIncomplete',
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
 * `{ en, th }` map so it can be resolved with `getTranslation(entry, i18n)` from
 * `@payloadcms/translations` in a server component, picking the editor's chosen
 * admin language. The unit test enforces that every key has both locales (i18n
 * gate for our own copy).
 */
export type Copy = { en: string; th: string }

export const adminCopy = {
  welcomeTitle: {
    en: 'Welcome to Wrenfield Works',
    th: 'ยินดีต้อนรับสู่ Wrenfield Works',
  },
  welcomeBody: {
    en: 'This is where you edit the public website — text, case studies, stats, and more. Changes go live as soon as you publish.',
    th: 'นี่คือที่สำหรับแก้ไขเว็บไซต์สาธารณะ — ข้อความ ผลงาน สถิติ และอื่น ๆ การเปลี่ยนแปลงจะแสดงผลทันทีเมื่อคุณกดเผยแพร่',
  },
  publishRule: {
    en: 'Before publishing, fill in BOTH English and Thai for every field. Drafts can be saved incomplete, but publishing is blocked until both languages are complete.',
    th: 'ก่อนเผยแพร่ กรุณากรอกทั้งภาษาอังกฤษและภาษาไทยให้ครบทุกช่อง ฉบับร่างบันทึกได้แม้ยังไม่ครบ แต่จะเผยแพร่ไม่ได้จนกว่าจะครบทั้งสองภาษา',
  },
  readinessTitle: {
    en: 'Publish readiness',
    th: 'ความพร้อมในการเผยแพร่',
  },
  readinessEn: { en: 'EN', th: 'อังกฤษ' },
  readinessTh: { en: 'TH', th: 'ไทย' },
  readinessPublished: { en: 'Published', th: 'เผยแพร่แล้ว' },
  readinessDraft: { en: 'Draft', th: 'ฉบับร่าง' },
  statusComplete: { en: 'Complete', th: 'ครบ' },
  statusIncomplete: { en: 'Incomplete', th: 'ไม่ครบ' },
  localeStatusHint: {
    en: 'Status as of the last save. Save a draft to refresh.',
    th: 'สถานะ ณ การบันทึกล่าสุด บันทึกฉบับร่างเพื่ออัปเดต',
  },
} satisfies Record<string, Copy>

export type AdminCopyKey = keyof typeof adminCopy
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/admin-copy.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/adminCopy.ts tests/unit/admin-copy.spec.ts
git commit -m "feat: bilingual admin copy with key-parity test

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Content-type registry (derive from config)

A helper that lists the content globals + collections (the ones with draft/publish) with their fields, so the readiness panel never drifts from `payload.config.ts`.

**Files:**
- Create: `src/lib/admin/contentTypes.ts`

> No unit test: this reads the live Payload config/runtime shape and is exercised by the dashboard e2e (Task 8). Keep it tiny and declarative.

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
}

/** Collections that are NOT editorial content (no EN/TH publish gate). */
const NON_CONTENT_COLLECTIONS = new Set(['users', 'media', 'payload-preferences', 'payload-migrations'])

function titleFromSlug(slug: string): string {
  return slug
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Derive the editorial content types from the sanitized config: every global,
 * plus collections that opt into drafts and aren't infrastructure. This mirrors
 * exactly the set wired with the publish-completeness gate, so the readiness
 * table can't list the wrong things.
 */
export function getContentTypes(payload: Payload): ContentType[] {
  const config = payload.config as SanitizedConfig
  const out: ContentType[] = []

  for (const g of config.globals ?? []) {
    out.push({ kind: 'global', slug: g.slug, label: g.label ? String(g.label) : titleFromSlug(g.slug), fields: g.fields })
  }

  for (const c of config.collections ?? []) {
    if (NON_CONTENT_COLLECTIONS.has(c.slug)) continue
    const hasDrafts = Boolean((c.versions as { drafts?: unknown } | undefined)?.drafts)
    if (!hasDrafts) continue
    out.push({ kind: 'collection', slug: c.slug, label: titleFromSlug(c.slug), fields: c.fields })
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
git commit -m "feat: derive editorial content-type registry from Payload config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Brand mark + logo components and favicon

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

The mark uses `currentColor` so CSS controls its color per theme. Geometry copied from `mark-brass.svg`.

```tsx
import * as React from 'react'

/**
 * Wrenfield Works mark — the 5-node "lattice peak" (graphics.Icon, T5). Strokes
 * and fills use `currentColor` so the admin theme recolors it (brass on dark,
 * ink on light) without swapping files. Decorative within the logo lockup, but
 * standalone it carries an accessible name.
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
    aria-label={title}
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
    <circle cx="50" cy="44" r="5.4" fill="none" stroke="currentColor" strokeWidth="2.6" />
    <circle cx="62" cy="66" r="4" fill="currentColor" />
    <circle cx="76" cy="34" r="4" fill="currentColor" />
  </svg>
)

export default BrandIcon
```

- [ ] **Step 3: Create `BrandLogo.tsx`**

The login lockup: mark + wordmark as live text (Fraunces via the serif token). "Works" takes the brass accent.

```tsx
import * as React from 'react'

import { BrandIcon } from './BrandIcon'

/**
 * Wrenfield Works lockup for the admin login screen (graphics.Logo, T5). The
 * wordmark is real text in the serif token (Fraunces) — selectable, crisp at any
 * size, and theme-adaptive. Mark color follows `currentColor` (the wrapper's
 * color); "Works" uses the brass accent token. Both pairs are AA on the admin
 * surfaces (verified in the theme a11y e2e).
 */
export const BrandLogo: React.FC = () => (
  <span
    className="wf-brand-logo"
    style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', color: 'var(--theme-text)' }}
  >
    <BrandIcon title="" />
    <span
      style={{
        fontFamily: 'var(--font-serif, Georgia, serif)',
        fontSize: '1.6rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      Wrenfield <span style={{ color: 'var(--theme-brand-accent, #cba265)' }}>Works</span>
    </span>
  </span>
)

export default BrandLogo
```

> `--theme-brand-accent` is defined in `custom.scss` (Task 10) per theme; the literal `#cba265` is a safe fallback if the variable is absent.

- [ ] **Step 4: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/BrandIcon.tsx src/components/admin/BrandLogo.tsx public/favicon.svg
git commit -m "feat: admin brand mark, logo lockup, and favicon

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Wire branding into the config + login e2e

**Files:**
- Modify: `src/payload.config.ts`
- Create (test): `tests/e2e/admin-branding.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Create `tests/e2e/admin-branding.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

import { gotoAdminLogin } from './admin-helpers'

/**
 * Admin branding (A): the login screen shows the Wrenfield Works lockup (not the
 * Payload default), and the document title carries the brand suffix.
 */
test.describe('Admin branding', () => {
  test('login shows the Wrenfield Works wordmark', async ({ page }) => {
    await gotoAdminLogin(page)
    await expect(page.getByText('Wrenfield', { exact: false }).first()).toBeVisible()
    await expect(page.locator('.wf-brand-logo')).toBeVisible()
  })

  test('document title includes the brand suffix', async ({ page }) => {
    await gotoAdminLogin(page)
    await expect(page).toHaveTitle(/Wrenfield Works/)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:e2e tests/e2e/admin-branding.spec.ts`
Expected: FAIL — no `.wf-brand-logo` on the page / title lacks the suffix.

> Requires the dev server; Playwright auto-starts `pnpm dev`. Ensure Postgres is up (`docker compose up -d db`).

- [ ] **Step 3: Wire `admin.components.graphics` and `admin.meta`**

In `src/payload.config.ts`, replace the `admin` block (currently `admin: { user: 'users', ... }`) with:

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

> Component paths are resolved relative to `src/` by Payload's import map. `BrandIcon`/`BrandLogo` are server-safe (no hooks/state) so no `'use client'` is needed.

- [ ] **Step 4: Regenerate the import map**

Run: `pnpm generate:importmap`
Expected: `src/app/(payload)/admin/importMap.js` now references `BrandLogo` and `BrandIcon`.

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

## Task 7: Bilingual admin i18n (Thai)

Enable Thai in the back office so our `{ en, th }` copy and field descriptions resolve to the editor's chosen language.

**Files:**
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Add the i18n config**

In `src/payload.config.ts`, add imports at the top (with the other `@payloadcms` imports):

```ts
import { en } from '@payloadcms/translations/languages/en'
import { th } from '@payloadcms/translations/languages/th'
```

Then add an `i18n` key to the `buildConfig({...})` object (next to `localization`):

```ts
  // Bilingual back office: Payload chrome available in EN + TH; editors pick their
  // admin language in account settings. EN is the fallback. (Content EN/TH is the
  // separate `localization` config above.)
  i18n: {
    supportedLanguages: { en, th },
    fallbackLanguage: 'en',
  },
```

- [ ] **Step 2: Verify the config builds and types are valid**

Run: `pnpm typecheck`
Expected: no errors (the `@payloadcms/translations` package ships with Payload 3.85).

- [ ] **Step 3: Verify the admin still loads (existing a11y e2e is the smoke test)**

Run: `pnpm test:e2e tests/e2e/us2-admin-a11y.spec.ts`
Expected: PASS — login + dashboard still render and pass axe (config didn't break the panel).

- [ ] **Step 4: Commit**

```bash
git add src/payload.config.ts
git commit -m "feat: enable Thai admin i18n (EN fallback) for bilingual back office

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Welcome card + publish-readiness panel + dashboard e2e

Two server components on `beforeDashboard`. The welcome card states the publish rule bilingually; the readiness panel reads each content type at `locale: 'all'` and renders an EN/TH table using the Task 2 logic.

**Files:**
- Create: `src/components/admin/WelcomeCard.tsx`
- Create: `src/components/admin/PublishReadiness.tsx`
- Modify: `src/payload.config.ts`
- Create (test): `tests/e2e/admin-guidance.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Create `tests/e2e/admin-guidance.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

import { gotoAdminLogin, loginAsStaff } from './admin-helpers'

/**
 * Editor guidance (C): after login the dashboard shows the welcome card (with the
 * publish rule) and the publish-readiness panel listing content types with EN/TH
 * indicators.
 */
test.describe('Admin editor guidance', () => {
  test('dashboard shows welcome card and readiness panel', async ({ page }) => {
    await gotoAdminLogin(page)
    await loginAsStaff(page)
    await expect(page.getByTestId('wf-welcome-card')).toBeVisible()
    await expect(page.getByTestId('wf-publish-readiness')).toBeVisible()
    // Readiness lists known content types (e.g. the Hero global, Stats collection).
    await expect(page.getByTestId('wf-publish-readiness')).toContainText(/Hero/i)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:e2e tests/e2e/admin-guidance.spec.ts`
Expected: FAIL — the test ids don't exist yet.

- [ ] **Step 3: Create `WelcomeCard.tsx` (server component)**

```tsx
import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import * as React from 'react'

import { adminCopy } from '@/lib/admin/adminCopy'

/**
 * Dashboard welcome card (beforeDashboard, T8). Server component: receives the
 * admin `i18n` so copy renders in the editor's chosen language. States what the
 * CMS edits and the non-negotiable publish rule (both EN + TH required, FR-014).
 */
const WelcomeCard: React.FC<{ i18n: I18nClient }> = ({ i18n }) => (
  <section
    data-testid="wf-welcome-card"
    style={{
      border: '1px solid var(--theme-elevation-150)',
      background: 'var(--theme-elevation-50)',
      borderRadius: '8px',
      padding: '20px 24px',
      marginBottom: '24px',
    }}
  >
    <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif, Georgia, serif)' }}>
      {getTranslation(adminCopy.welcomeTitle, i18n)}
    </h2>
    <p style={{ margin: '0 0 12px', color: 'var(--theme-elevation-700)' }}>
      {getTranslation(adminCopy.welcomeBody, i18n)}
    </p>
    <p
      style={{
        margin: 0,
        padding: '10px 14px',
        borderLeft: '3px solid var(--theme-brand-accent, #cba265)',
        background: 'var(--theme-elevation-100)',
        borderRadius: '4px',
      }}
    >
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

import { adminCopy } from '@/lib/admin/adminCopy'
import { collectLocaleStatus } from '@/lib/admin/completeness'
import { getContentTypes } from '@/lib/admin/contentTypes'

/**
 * Publish-readiness panel (beforeDashboard, T8). Server component: reads each
 * content type at `locale: 'all'` / `fallbackLocale: 'none'` / `draft: true` and
 * renders an EN/TH + published/draft table. Same completeness logic as the gate,
 * so the indicator previews exactly what publishing will allow (FR-014).
 */
type Row = { label: string; en: boolean; th: boolean; published: boolean }

async function loadRows(payload: Payload): Promise<Row[]> {
  const types = getContentTypes(payload)
  const rows: Row[] = []
  for (const t of types) {
    try {
      let doc: Record<string, unknown> = {}
      if (t.kind === 'global') {
        doc = (await payload.findGlobal({
          slug: t.slug,
          locale: 'all',
          fallbackLocale: 'none',
          draft: true,
          depth: 0,
          overrideAccess: true,
        })) as unknown as Record<string, unknown>
        const status = collectLocaleStatus(t.fields, doc)
        rows.push({ label: t.label, en: status.enComplete, th: status.thComplete, published: doc._status === 'published' })
      } else {
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
        const en = docs.every((d) => collectLocaleStatus(t.fields, d).enComplete)
        const th = docs.every((d) => collectLocaleStatus(t.fields, d).thComplete)
        const published = docs.length > 0 && docs.every((d) => d._status === 'published')
        rows.push({ label: `${t.label} (${docs.length})`, en, th, published })
      }
    } catch {
      rows.push({ label: t.label, en: false, th: false, published: false })
    }
  }
  return rows
}

const Tick: React.FC<{ ok: boolean; i18n: I18nClient }> = ({ ok, i18n }) => (
  <span
    aria-label={getTranslation(ok ? adminCopy.statusComplete : adminCopy.statusIncomplete, i18n)}
    style={{ color: ok ? 'var(--theme-success-500, #2f7a45)' : 'var(--theme-error-500, #a13a3a)', fontWeight: 700 }}
  >
    {ok ? '✓' : '✗'}
  </span>
)

const PublishReadiness: React.FC<{ payload: Payload; i18n: I18nClient }> = async ({ payload, i18n }) => {
  const rows = await loadRows(payload)
  return (
    <section
      data-testid="wf-publish-readiness"
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px',
      }}
    >
      <h3 style={{ margin: '0 0 12px' }}>{getTranslation(adminCopy.readinessTitle, i18n)}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--theme-elevation-700)' }}>
            <th style={{ padding: '4px 8px' }}>&nbsp;</th>
            <th style={{ padding: '4px 8px' }}>{getTranslation(adminCopy.readinessEn, i18n)}</th>
            <th style={{ padding: '4px 8px' }}>{getTranslation(adminCopy.readinessTh, i18n)}</th>
            <th style={{ padding: '4px 8px' }}>
              {getTranslation(adminCopy.readinessPublished, i18n)}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
              <td style={{ padding: '6px 8px' }}>{r.label}</td>
              <td style={{ padding: '6px 8px' }}>
                <Tick ok={r.en} i18n={i18n} />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <Tick ok={r.th} i18n={i18n} />
              </td>
              <td style={{ padding: '6px 8px', color: 'var(--theme-elevation-700)' }}>
                {getTranslation(r.published ? adminCopy.readinessPublished : adminCopy.readinessDraft, i18n)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default PublishReadiness
```

- [ ] **Step 5: Wire both into `beforeDashboard`**

In `src/payload.config.ts`, inside `admin.components` (added in Task 6), add `beforeDashboard`:

```ts
    components: {
      graphics: {
        Logo: '/components/admin/BrandLogo#BrandLogo',
        Icon: '/components/admin/BrandIcon#BrandIcon',
      },
      beforeDashboard: [
        '/components/admin/WelcomeCard#default',
        '/components/admin/PublishReadiness#default',
      ],
    },
```

- [ ] **Step 6: Regenerate the import map**

Run: `pnpm generate:importmap`
Expected: `importMap.js` now references `WelcomeCard` and `PublishReadiness`.

- [ ] **Step 7: Seed dev data if needed, then run the e2e test**

If the dev DB is empty, the readiness table still renders (rows show as incomplete). To exercise it with content: `pnpm seed` (optional).

Run: `pnpm test:e2e tests/e2e/admin-guidance.spec.ts`
Expected: PASS — welcome card + readiness panel visible; panel mentions "Hero".

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/WelcomeCard.tsx src/components/admin/PublishReadiness.tsx src/payload.config.ts "src/app/(payload)/admin/importMap.js" tests/e2e/admin-guidance.spec.ts
git commit -m "feat: dashboard welcome card + EN/TH publish-readiness panel

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Per-document EN/TH status field in the edit view

A server-rendered `ui` field at the top of each content type showing that document's EN/TH status as of the last save.

**Files:**
- Create: `src/components/admin/LocaleStatusField.tsx`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create `LocaleStatusField.tsx` (server component)**

A `ui` field's custom component receives Payload's field server props, including `id`, `collectionSlug`/`globalSlug`, `payload`, and `i18n`.

```tsx
import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import * as React from 'react'
import type { Payload } from 'payload'

import { adminCopy } from '@/lib/admin/adminCopy'
import { collectLocaleStatus } from '@/lib/admin/completeness'
import { getContentTypes } from '@/lib/admin/contentTypes'

/**
 * Inline EN/TH status banner for a single document's edit view (ui field, T9).
 * Server component: re-reads the saved doc at `locale: 'all'` and reports its
 * per-locale completeness as of the last save (live cross-locale state isn't
 * available in the edit form, which only holds the active locale). Authoritative
 * blocking stays with the publish gate; this is a heads-up.
 */
type Props = {
  payload: Payload
  i18n: I18nClient
  id?: string | number
  collectionSlug?: string
  globalSlug?: string
}

const Badge: React.FC<{ label: string; ok: boolean; i18n: I18nClient }> = ({ label, ok, i18n }) => (
  <span
    style={{
      display: 'inline-flex',
      gap: '6px',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '999px',
      border: '1px solid var(--theme-elevation-200)',
      background: ok ? 'var(--theme-success-50, #e7f3ec)' : 'var(--theme-error-50, #f7e9e9)',
    }}
  >
    <strong>{label}</strong>
    <span aria-hidden>{ok ? '✓' : '✗'}</span>
    <span style={{ color: 'var(--theme-elevation-700)' }}>
      {getTranslation(ok ? adminCopy.statusComplete : adminCopy.statusIncomplete, i18n)}
    </span>
  </span>
)

const LocaleStatusField: React.FC<Props> = async ({ payload, i18n, id, collectionSlug, globalSlug }) => {
  const slug = collectionSlug ?? globalSlug
  const type = getContentTypes(payload).find((t) => t.slug === slug)
  if (!type) return null

  let doc: Record<string, unknown> = {}
  try {
    if (type.kind === 'global') {
      doc = (await payload.findGlobal({ slug: type.slug, locale: 'all', fallbackLocale: 'none', draft: true, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>
    } else if (id != null) {
      doc = (await payload.findByID({ collection: type.slug, id, locale: 'all', fallbackLocale: 'none', draft: true, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>
    }
  } catch {
    return null
  }

  const status = collectLocaleStatus(type.fields, doc)
  return (
    <div
      data-testid="wf-locale-status"
      style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', margin: '0 0 16px' }}
    >
      <Badge label={getTranslation(adminCopy.readinessEn, i18n)} ok={status.enComplete} i18n={i18n} />
      <Badge label={getTranslation(adminCopy.readinessTh, i18n)} ok={status.thComplete} i18n={i18n} />
      <small style={{ color: 'var(--theme-elevation-600)' }}>
        {getTranslation(adminCopy.localeStatusHint, i18n)}
      </small>
    </div>
  )
}

export default LocaleStatusField
```

- [ ] **Step 2: Add the `ui` field to each content type via the config wiring helpers**

In `src/payload.config.ts`, the `withCollectionContent` / `withGlobalContent` helpers already wrap every content type. Add the status `ui` field to the front of each one's `fields` there, so it appears once per content type without editing 14 files.

In `withCollectionContent`, change the returned object to prepend the field:

```ts
const localeStatusField = {
  name: 'localeStatus',
  type: 'ui' as const,
  admin: { components: { Field: '/components/admin/LocaleStatusField#default' } },
}

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

And in `withGlobalContent`:

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

> A `ui` field holds no data and is ignored by the completeness walker (it skips `type: 'ui'`) and by `generate:types`, so this does not change the DB schema or the publish gate.

- [ ] **Step 3: Regenerate the import map and types**

Run: `pnpm generate:importmap && pnpm generate:types`
Expected: `importMap.js` references `LocaleStatusField`; `payload-types.ts` is unchanged by the `ui` field.

- [ ] **Step 4: Extend the dashboard/guidance e2e to cover the edit view**

Append to `tests/e2e/admin-guidance.spec.ts`:

```ts
test('edit view shows the per-document EN/TH status banner', async ({ page }) => {
  await gotoAdminLogin(page)
  await loginAsStaff(page)
  await page.goto('/admin/globals/hero')
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('wf-locale-status')).toBeVisible()
})
```

- [ ] **Step 5: Run the e2e test to verify it passes**

Run: `pnpm test:e2e tests/e2e/admin-guidance.spec.ts`
Expected: PASS (welcome, readiness, and the edit-view banner).

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/LocaleStatusField.tsx src/payload.config.ts "src/app/(payload)/admin/importMap.js" tests/e2e/admin-guidance.spec.ts
git commit -m "feat: per-document EN/TH status banner in edit views

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Bilingual field descriptions

Widen the localized field helpers to accept `{ en, th }` descriptions, then add helpful bilingual help text to the content fields.

**Files:**
- Modify: `src/fields/localized.ts`
- Modify: content collections/globals (descriptions) — start with `src/globals/Hero.ts` and `src/collections/Stats.ts`

- [ ] **Step 1: Widen the helper's `description` type**

In `src/fields/localized.ts`, change the `Common` type and the three localized helpers so `description` may be a language map. Payload's `admin.description` accepts a `Record<string, string>` keyed by language code.

Replace the `Common` type:

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

The three spreads (`...(description ? { admin: { description } } : {})`) already pass `description` straight through, so they work unchanged for the map form. Leave `monoText` and `orderField` as-is.

- [ ] **Step 2: Type-check the helper change**

Run: `pnpm typecheck`
Expected: no errors (existing string callers still satisfy the wider union).

- [ ] **Step 3: Add bilingual descriptions to two representative types**

In `src/globals/Hero.ts`, add descriptions to the localized fields:

```ts
  fields: [
    localizedText({
      name: 'kicker',
      required: true,
      description: { en: 'Small label above the headline.', th: 'ป้ายข้อความเล็กเหนือพาดหัว' },
    }),
    localizedRichText({
      name: 'headline',
      required: true,
      description: { en: 'Main hero headline.', th: 'พาดหัวหลักของส่วนเปิด' },
    }),
    localizedRichText({
      name: 'subhead',
      required: true,
      description: { en: 'Supporting sentence under the headline.', th: 'ประโยคสนับสนุนใต้พาดหัว' },
    }),
    localizedText({
      name: 'trustLabel',
      required: true,
      description: { en: 'Short trust line (e.g. clients served).', th: 'ข้อความสร้างความเชื่อมั่นสั้น ๆ' },
    }),
    localizedText({
      name: 'primaryCtaLabel',
      required: true,
      description: { en: 'Primary button text.', th: 'ข้อความปุ่มหลัก' },
    }),
    localizedText({
      name: 'secondaryCtaLabel',
      required: true,
      description: { en: 'Secondary button text.', th: 'ข้อความปุ่มรอง' },
    }),
  ],
```

In `src/collections/Stats.ts`, add a description to the localized `label`:

```ts
    localizedText({
      name: 'label',
      label: 'Label',
      required: true,
      description: { en: 'What this number measures.', th: 'ตัวเลขนี้วัดอะไร' },
    }),
```

> Remaining content types can get descriptions the same way; these two prove the pattern and the e2e. Adding the rest is mechanical and can be folded into this commit or a follow-up.

- [ ] **Step 4: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Verify a description renders (manual or reuse the edit-view e2e)**

Run: `pnpm test:e2e tests/e2e/admin-guidance.spec.ts`
Expected: PASS (the Hero edit view still loads with the status banner; descriptions now appear under fields).

- [ ] **Step 6: Commit**

```bash
git add src/fields/localized.ts src/globals/Hero.ts src/collections/Stats.ts
git commit -m "feat: bilingual {en,th} field descriptions (helper + Hero/Stats)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Editorial theme + Fraunces + default-dark provider

Override Payload's documented theme variables to the brand palette in both themes, apply Fraunces to headings, and default new editors to the dark theme while keeping the switcher.

**Files:**
- Modify: `src/app/(payload)/custom.scss`
- Modify: `src/app/(payload)/layout.tsx`
- Create: `src/components/admin/DefaultDarkTheme.tsx`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Write the editorial theme**

Replace the contents of `src/app/(payload)/custom.scss` with variable overrides. Payload sets `data-theme="dark"` / `"light"` on `<html>`; override the documented theme variables only.

```scss
/* Custom Payload admin styles. Back-office UI must meet WCAG 2.1 AA (FR-007).
   Override Payload's documented theme variables ONLY (never internal classes) so
   this survives Payload upgrades. Brand palette mirrors src/styles/tokens.css. */

/* Fallback face so headings get Fraunces even where the next/font variable is not
   in scope (e.g. portaled modals). next/font is primary; this is the safety net. */

:root {
  --wf-ink: #15181d;
  --wf-ink-2: #1e242c;
  --wf-paper: #ece5d8;
  --wf-brass: #cba265;
  --wf-brass-deep: #b5894a;
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
  --theme-elevation-700: #b9c0c8; /* muted text ≥4.5:1 on ink */
  --theme-elevation-800: #d6dbe0;
  --theme-elevation-900: #ece5d8;
  --theme-brand-accent: var(--wf-brass);
  --theme-success-500: #86b88a;
  --theme-error-500: #e0908c;
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
  --theme-elevation-600: #5c5446; /* muted text ≥4.5:1 on paper */
  --theme-elevation-700: #4a4338;
  --theme-brand-accent: #6f5325; /* bronze, ≥4.5:1 as text on paper */
  --theme-success-500: #2f7a45;
  --theme-error-500: #a13a3a;
}

/* Headings in the brand serif (next/font variable from the layout wrapper). */
.wf-admin-fonts h1,
.wf-admin-fonts h2,
.wf-admin-fonts h3 {
  font-family: var(--font-serif, Georgia, serif);
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

- [ ] **Step 2: Wrap admin children with the font variables**

In `src/app/(payload)/layout.tsx`, import the font variables and wrap `{children}`. Custom properties inherit through `display: contents`, so the wrapper adds no box.

Add the import near the top:

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

- [ ] **Step 3: Create the default-dark provider**

```tsx
'use client'

import * as React from 'react'

/**
 * Default the admin to the dark theme on first visit (T11). Payload persists the
 * user's theme choice in its preferences cookie + `data-theme` on <html>. When an
 * editor has never chosen, Payload may follow the OS; this nudges the default to
 * dark (the brand default) without removing the switcher (admin.theme stays 'all').
 * Only acts when no explicit Payload theme preference is present.
 */
export const DefaultDarkTheme: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    try {
      const hasPref = document.cookie.includes('payload-theme=')
      if (!hasPref) {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    } catch {
      /* no-op: theme falls back to Payload's default */
    }
  }, [])
  return <>{children}</>
}

export default DefaultDarkTheme
```

- [ ] **Step 4: Wire `theme: 'all'` and the provider into the config**

In `src/payload.config.ts`, inside the `admin` object add `theme: 'all'` and register the provider:

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

- [ ] **Step 5: Regenerate the import map**

Run: `pnpm generate:importmap`
Expected: `importMap.js` references `DefaultDarkTheme`.

- [ ] **Step 6: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(payload)/custom.scss" "src/app/(payload)/layout.tsx" src/components/admin/DefaultDarkTheme.tsx src/payload.config.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat: editorial admin theme (brass/ink/paper) + Fraunces + default dark

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: A11y gate — both themes — and final verification

Prove WCAG 2.1 AA on the login and dashboard in **dark** and **light** (closes FR-007 for these screens), then run the full suite.

**Files:**
- Create (test): `tests/e2e/admin-theme-a11y.spec.ts`

- [ ] **Step 1: Write the a11y e2e for both themes**

Create `tests/e2e/admin-theme-a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { gotoAdminLogin, loginAsStaff } from './admin-helpers'

/**
 * Admin editorial theme a11y (D, FR-007): the branded admin passes WCAG 2.1 AA in
 * BOTH dark and light themes, on the login screen and the dashboard (which now
 * carries our custom welcome card + readiness panel).
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function setTheme(page: import('@playwright/test').Page, theme: 'dark' | 'light') {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
}

for (const theme of ['dark', 'light'] as const) {
  test(`login passes AA in ${theme} theme`, async ({ page }) => {
    await gotoAdminLogin(page)
    await setTheme(page, theme)
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(results.violations).toEqual([])
  })

  test(`dashboard passes AA in ${theme} theme`, async ({ page }) => {
    await gotoAdminLogin(page)
    await loginAsStaff(page)
    await setTheme(page, theme)
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(results.violations).toEqual([])
  })
}
```

- [ ] **Step 2: Run it**

Run: `pnpm test:e2e tests/e2e/admin-theme-a11y.spec.ts`
Expected: PASS in both themes. If a contrast violation appears, adjust the offending `--theme-elevation-*` / `--theme-brand-accent` value in `custom.scss` (lighten on dark, darken on light) until AA passes — the variables are the only knob, by design.

- [ ] **Step 3: Run the whole admin e2e set + the publish-gate regression once more**

Run: `pnpm test:e2e tests/e2e/admin-branding.spec.ts tests/e2e/admin-guidance.spec.ts tests/e2e/admin-theme-a11y.spec.ts tests/e2e/us2-admin-a11y.spec.ts`
Then: `pnpm test:integration`
Expected: all PASS.

- [ ] **Step 4: Run unit tests + lint**

Run: `pnpm test:unit && pnpm lint`
Expected: unit PASS; `eslint` + `prettier --check` + `tsc --noEmit` all clean.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/admin-theme-a11y.spec.ts
git commit -m "test: admin AA gate across dark + light themes (FR-007)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review notes (author)

- **Spec coverage:** A → Tasks 5,6 (+favicon/meta). C → Tasks 2,3,4,8,9,10 (welcome card, readiness panel, inline badge, descriptions, Thai i18n). D → Tasks 7,11,12 (theme, fonts, default dark, AA gate). Reuse/refactor → Task 1. Every spec section maps to a task.
- **Regression guard correction:** the design mentioned re-running the "existing publishCompleteness unit suite," but there is none — the guard is the **integration** suite `us2-publish-gate.spec.ts` (Task 1, Step 7) plus the new `locale-fields.spec.ts`.
- **Type consistency:** `walkLocalizedLeaves`, `isBlank`, `VALUE_FIELD_TYPES`, `AnyRecord` (localeFields) used identically in publishCompleteness + completeness; `collectLocaleStatus` returns `{enMissing, thMissing, enComplete, thComplete}` used consistently in PublishReadiness + LocaleStatusField; `adminCopy` keys referenced match the keys defined; component import paths use `#default` for default exports and `#BrandLogo`/`#BrandIcon`/`#DefaultDarkTheme` for named exports (matches each file's export style).
- **Env reminders:** integration/e2e need Postgres (`docker compose up -d db`); `generate:importmap` after every `admin.components.*` change.
