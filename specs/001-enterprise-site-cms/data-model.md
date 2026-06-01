# Phase 1 Data Model: Wrenfield Works Enterprise Site + CMS

Locales: `en` (default), `th`. Fields marked **L** are localized (separate EN/TH values).
Fields marked **mono** are intentionally non-localized brand/technical labels (FR-011).

All content collections and globals have **drafts + versions** enabled (audit trail FR-020,
conflict detection FR-020a, preview FR-018). A publish hook blocks publishing when any **L** field
is missing either locale (FR-014).

## Globals (singletons)

### Hero
| Field | Type | Notes |
|-------|------|-------|
| kicker | text **L** | "AI-assisted systems, built right." |
| headline | richText **L** | supports emphasized span (`<em>`) per design |
| subhead | richText **L** | supports bold span |
| trustLabel | text **L** | trust strip text |
| primaryCtaLabel | text **L** | e.g., "See selected work" |
| secondaryCtaLabel | text **L** | e.g., "Start a project" |

### NavLabels
`capabilities`, `platform`, `work`, `process`, `ctaLabel` — all text **L**.

### Marquee
| Field | Type | Notes |
|-------|------|-------|
| heading | text **L** | marquee header line |

### SectionHeadings
Repeating group of 4 (capabilities, platform, work, process), each:
`number` text **mono** (01–04) · `title` richText **L** · `subtitle` text **L**.

### Testimonial
`quote` richText **L** · `attribution` richText **L**.

### CallToAction
`kicker` text **L** · `heading` richText **L** · `body` text **L** · `email` email ·
`bookCallLabel` text **L** · `socialLinks` array of `{ label, url }`.

### Footer
`blurb` text **L** · `studioLinks` array `{ label **L**, anchor }` · `connectLinks` array
`{ label, url }` · `bottomNote` text **L**.

### SEOMetadata
| Field | Type | Notes |
|-------|------|-------|
| title | text **L** | page `<title>` per locale (FR-011a, FR-015a) |
| description | textarea **L** | meta description per locale |
| ogImage | relationship → Media | social-share image |

## Collections (ordered, repeatable — full add/remove/reorder per FR-015)

### Capabilities
`order` number · `categoryLabel` text **mono** (e.g., "Automation") · `icon` select ·
`title` text **L** · `description` textarea **L** · `tags` array `{ value }` (mixed).

### CaseStudies
`order` number · `tag` text **mono** (e.g., "CRM · Platform") · `glyph` text **mono** (single letter)
· `title` text **L** · `description` textarea **L** · `metricsLine` richText **L**.

### ProcessSteps
`order` number · `number` text **mono** (01–03) · `name` text **L** · `title` text **L** ·
`description` textarea **L** · `checklist` array `{ point text **L** }`.

### Stats
`order` number · `value` number (numeric, validated) · `unit` text **mono** (e.g., `+`, `%`, `×`) ·
`label` text **L**.

### ShowcaseSurfaces
`order` number · `tabName` text **mono** (e.g., "A · Automation") · `tabTitle` text **L** ·
`tabDescription` text **L** · `panel` blocks (mock rows / KPI grid / chart / code lines) with any
visible labels localized **L**.

### ClientLogos
`order` number · `name` text **mono** (brand names stay as-is).

### Inquiries  *(personal data — PDPA)*
| Field | Type | Notes |
|-------|------|-------|
| name | text | required |
| email | email | required, validated |
| message | textarea | required |
| locale | select (`en`/`th`) | language visitor used (FR-024) |
| consent | checkbox | MUST be true to submit (FR-026) |
| consentAt | date | server-set at submission |
| submittedAt | date | server-set (createdAt) |
| expiresAt | date | server-set = submittedAt + 24 months (FR-027) |
| status | select (`new`/`read`/`archived`) | inbox triage; default `new` |

Access: create = public (via the API route only); read/update/delete = authenticated staff only.

### Users  *(back office)*
`email` (unique) · `password` (hashed by Payload) · `name` · single role: all users are `staff`
with full access (clarification). Auth required for all admin access (FR-012, deny-by-default).

### Media
Uploads (OG/social images) stored in in-region object storage; `alt` text **L**.

## Relationships

- `SEOMetadata.ogImage` → `Media`.
- Public page composition reads: all globals + ordered `Capabilities`, `ShowcaseSurfaces`,
  `CaseStudies`, `ProcessSteps`, `Stats`, `ClientLogos` (published only).
- `Inquiries` are independent; created by the public API route, read in the back office.

## Validation rules

- **Publish completeness (FR-014)**: a document cannot reach `published` status if any localized
  field lacks an `en` or `th` value. Enforced by a shared publish hook; surfaces a clear message.
- **Stat value (FR-019)**: `value` must be a valid number; unit is a short symbol.
- **Inquiry (FR-023, FR-026)**: `name`, `email` (valid format), `message`, and `consent === true`
  are required; spam checks (Turnstile + honeypot + rate limit) pass before persistence.
- **Links**: URL fields validated as well-formed URLs.

## State transitions

**Content (collections & globals)**
```
draft ──publish──▶ published        (immediate; visible to public)
published ──new edit──▶ draft (of next version) ──publish──▶ published
save with stale version ──▶ REJECTED (conflict warning, FR-020a)
```

**Inquiry**
```
(public submit, consent=true) ──▶ new ──staff──▶ read ──staff──▶ archived
any state ──submittedAt + 24mo──▶ auto-permanently-deleted (FR-027; monitored, FR-027a)
any state ──staff "delete on request"──▶ removed (FR-028)
```

## Indexing / scale notes

- Index `Inquiries.expiresAt` (retention job query) and `status` (inbox filter).
- Index collection `order` + publish status for fast public reads.
- Read-heavy public traffic served via static/ISR + CDN; DB load is dominated by low-volume admin
  writes and the daily retention job.
