# Feature Specification: Wrenfield Works Enterprise Site + CMS

**Feature Branch**: `001-enterprise-site-cms`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Read the attached frist-pilot.zip and the README inside. Implement: Wrenfield Works - Enterprise.html โดยมี CMS หลังบ้าน"

## Overview

Wrenfield Works needs a public, bilingual (English / ไทย) marketing website that faithfully
reproduces the approved "Enterprise" design, **plus a back-office Content Management System (CMS)**
that lets non-technical staff edit every piece of content shown on that site — in both languages —
without touching code or redeploying.

The public site presents the studio's positioning across the sections in the approved design:
navigation, hero, client logo marquee, headline statistics, capabilities, a platform showcase
(tabbed), selected work / case studies, a "how we work" process walkthrough, a testimonial, a
call-to-action, and a footer. The CMS is the source of truth for the words and numbers in all of
those sections.

> Terminology: "back office", "CMS", and "admin" all refer to the same authenticated
> content-management interface used by staff.

## Clarifications

### Session 2026-05-31 (4) — decision confirmations

- Q: Theme scope for this release? → A: **Ship both themes** — dark (default) and the paper/light
  theme — with a visitor-facing toggle whose choice persists; both themes must meet AA contrast.
- Q: Inquiry retention action at 24 months? → A: **Permanent deletion** of the whole record
  (confirmed; unchanged).
- Q: Back-office accessibility level? → A: **WCAG 2.1 AA applies to the back office too**, not only
  the public site.

### Session 2026-05-31 (3) — checklist review resolutions

- Theme scope: superseded by Session (4) — both dark and paper themes ship with a visitor toggle.
- Back-office accessibility scope: superseded by Session (4) — the back office must also meet AA.
- Inquiry retention action: at 24 months an inquiry is **permanently deleted** (not merely
  anonymized), making SC-010 unambiguous and testable.
- Non-translated label policy: the set of intentionally English-only labels is an **explicit,
  enumerated list** (see FR-011), not an ad-hoc judgment.
- Numeric/currency display values (e.g., `฿2.4M`, `99.9%`) are **authored as content per locale**;
  no automatic locale reformatting is required this release.

### Session 2026-05-31 (2)

- Q: Should the CMS manage SEO / social-share metadata (page title, meta description, OG image)? →
  A: Yes — editors manage SEO and social-share metadata through the CMS in both English and Thai,
  including a social-share image.
- Q: Should the site include web analytics, and how should cookie consent be handled? → A:
  Cookieless, privacy-friendly analytics that capture aggregate traffic/conversion without
  identifying individuals — no cookie-consent banner required.
- Q: How long should inquiry personal data be retained before automatic deletion (PDPA)? → A:
  24 months from submission, after which it is automatically removed or anonymized.

### Session 2026-05-31

- Q: How should personal data from inquiry submissions be handled for privacy/compliance (Thai
  market = PDPA)? → A: Full PDPA-aligned handling — explicit consent at submission, a stated
  retention period, and the ability to delete a person's data on request.
- Q: When two editors edit the same content at the same time, how should the system behave? → A:
  Optimistic concurrency — let editing proceed freely, detect the conflict on save, block the
  overwrite, and warn the second editor that the content changed.
- Q: What user-permission model should the back office have? → A: A single staff role — every
  signed-in staff member can edit and publish all content and view the inquiry inbox; finer roles
  can be added later without rework.
- Q: How should the team be alerted to a new inquiry? → A: Send an email notification to the studio
  when a new inquiry arrives, in addition to it appearing in the back-office inbox.
- Q: How should publishing work when an editor publishes content? → A: Immediate publish — the
  change goes live as soon as it is published; the existing draft + preview serve as the pre-publish
  safety net (scheduling/versioned rollback are out of scope for this release).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor explores the bilingual marketing site (Priority: P1)

A prospective client visits the site, reads the studio's positioning, switches between English and
Thai, browses on desktop or phone, and reaches a clear way to get in touch.

**Why this priority**: This is the public face of the business and the reason the site exists. It
delivers value on its own (a complete, on-brand marketing site) even before any other story is
built, as long as it can display seeded content.

**Independent Test**: Load the site with seeded content, scroll through every section, toggle the
language between EN and ไทย, resize from phone to wide desktop, and confirm all sections render
correctly, all prose translates, and the language choice is remembered on the next visit.

**Acceptance Scenarios**:

1. **Given** a visitor opens the home page in English, **When** the page loads, **Then** all
   sections (nav, hero, logo marquee, stats, capabilities, platform showcase, selected work,
   process, testimonial, call-to-action, footer) are visible with their English content.
2. **Given** a visitor is reading the page in English, **When** they select "ไทย", **Then** all
   human-readable prose switches to Thai while the visual layout and the brand's intentional
   technical labels remain consistent, and the headline re-animates in the new language.
3. **Given** a visitor previously chose Thai, **When** they return to the site later, **Then** the
   site loads in Thai automatically.
4. **Given** a visitor on a small phone screen, **When** they view any section, **Then** content
   reflows to a single, readable column with no horizontal scrolling or overlapping elements.
5. **Given** a visitor who has enabled "reduce motion" in their system, **When** they load the
   site, **Then** decorative animations are disabled or minimized while all content stays fully
   readable and usable.
6. **Given** a visitor navigating only by keyboard or with a screen reader, **When** they move
   through the page, **Then** every interactive element is reachable, clearly focused, and labeled.
7. **Given** a visitor in the platform showcase, **When** they select a different surface tab
   (Automation / Internal tools / Custom systems), **Then** the matching example panel is shown.

---

### User Story 2 - Content editor manages all site content in both languages (Priority: P2)

A non-technical staff member signs in to the back office and updates the words and numbers shown on
the public site — the hero message, statistics, capability cards, showcase examples, case studies,
process steps, testimonial, call-to-action, and footer — providing both an English and a Thai
version, then publishes the change so visitors see it.

**Why this priority**: It is the explicit second half of the request ("CMS หลังบ้าน") and is what
makes the site maintainable by the business instead of by developers. It depends on the public site
existing to render its output.

**Independent Test**: Sign in to the CMS, change a piece of content (e.g., the hero headline) in
both EN and TH, publish, then load the public site and confirm the new content appears in both
languages.

**Acceptance Scenarios**:

1. **Given** an unauthenticated person, **When** they try to open any CMS page or back-office
   action, **Then** they are denied and redirected to sign in.
2. **Given** a signed-in editor, **When** they open the content for any section, **Then** they can
   edit its English and Thai values in clearly separated fields.
3. **Given** an editor has changed a piece of content and provided both EN and TH values, **When**
   they publish, **Then** the change appears on the public site for visitors.
4. **Given** an editor tries to publish content that is missing either the English or the Thai
   value, **When** they attempt to publish, **Then** publishing is blocked with a clear message
   identifying what is missing.
5. **Given** an editor is editing content, **When** they preview before publishing, **Then** they
   see how the change will look on the public site without it being visible to visitors yet.
6. **Given** an editor enters an invalid value for a numeric statistic (e.g., a non-number),
   **When** they save, **Then** they get a clear, actionable error and the bad value is not saved.

---

### User Story 3 - Prospect submits an inquiry the studio can act on (Priority: P3)

A prospective client uses the "Get in touch / Start a project" call-to-action to fill in an on-site
inquiry form and send their project details, and the studio sees that inquiry stored in the back
office. (The design's `mailto:` link is replaced by this on-site form; submissions are stored and
viewable in the CMS.)

**Why this priority**: It turns the marketing site from a brochure into a lead source. It is
valuable but secondary to having the site and being able to maintain it.

**Independent Test**: Submit the inquiry form as a visitor, then sign in to the back office and
confirm the submission appears with its details and timestamp.

**Acceptance Scenarios**:

1. **Given** a visitor on the call-to-action section, **When** they submit a valid inquiry, **Then**
   they receive a clear confirmation that the message was sent.
2. **Given** a visitor submits an inquiry with missing or invalid required fields, **When** they
   submit, **Then** they see field-level guidance and the inquiry is not sent.
3. **Given** a signed-in staff member, **When** they open the inbox, **Then** they see submitted
   inquiries with sender details, message, language, and time of submission.

---

### Edge Cases

- **Missing translation at render time**: If a piece of content somehow has only one language
  populated, the public site MUST fall back gracefully (show the available language) rather than
  display a blank, broken, or key-like placeholder.
- **Empty collections**: If a repeatable section (e.g., case studies, capabilities, logos) has no
  published items, the corresponding section MUST hide or collapse cleanly without leaving an empty
  framed gap.
- **Very long translated text**: Copy up to at least 50% longer than the design's reference length
  (for either language) MUST wrap and reflow without breaking the layout, overlapping, or clipping.
- **Per-locale item existence/order**: A collection item's existence and display order are shared
  across locales; only its field *values* are localized. Adding/removing/reordering applies to both
  languages at once (an item with one locale's values empty is caught by the publish gate, FR-014).
- **Concurrent edits**: If two editors edit the same content concurrently, the system MUST allow
  both to edit, but on save MUST detect that the content changed since it was opened, block the
  conflicting overwrite, and warn the second editor that the content was updated (so no one's work
  is silently discarded).
- **Unpublished/draft content**: Draft changes MUST never be visible to public visitors until
  published.
- **Slow or failed content load**: If content cannot be loaded, the visitor MUST see a graceful
  state, not a crash or a half-rendered page.
- **Stale language preference**: A returning visitor whose saved language is no longer valid MUST
  default to English without error.

## Requirements *(mandatory)*

### Functional Requirements — Public Site

- **FR-001**: The site MUST present all sections of the approved design — navigation, hero, client
  logo marquee, headline statistics, capabilities, platform showcase, selected work, process,
  testimonial, call-to-action, and footer — matching the approved visual design. "Matching" is
  judged against the handoff bundle as the authoritative reference: the design tokens (color,
  spacing, typography, radius) MUST be reproduced exactly, and the layout MUST be visually reviewed
  against the reference at the defined responsive breakpoints (see FR-005) before release.
- **FR-002**: The site MUST support English and Thai, and MUST let the visitor switch language at
  any time, updating all human-readable prose to the selected language.
- **FR-003**: The site MUST remember a visitor's language choice and apply it automatically on
  return visits.
- **FR-004**: The site MUST apply Thai-appropriate typography so Thai text renders clearly and is
  never clipped. Measurable criteria: for Thai, display/heading line-height MUST be ≥ 1.25, letter
  spacing (tracking) MUST NOT be negative, the display heading size MUST use the design's reduced
  Thai scale, and no text may be truncated or overlap its container at any supported width.
- **FR-005**: The site MUST be responsive and remain readable and usable across the supported width
  range of 360px to ≥ 1440px, with no horizontal scrolling, overlap, or clipped text at any size.
  Layout is verified at the design's breakpoints (≈520, 820, 900, 1000, 1080px) and the range
  endpoints.
- **FR-005a**: The site MUST present explicit loading states for any content or action that is not
  instantaneous (asynchronous content rendering and inquiry submission), so the visitor never sees a
  blank or frozen region with no feedback.
- **FR-005b**: The site MUST offer two themes — dark (default) and paper/light — with a
  visitor-facing toggle. The chosen theme MUST persist across the visit and on return visits, and
  both themes MUST meet the AA contrast targets in FR-007.
- **FR-006**: The site MUST honor the visitor's "reduce motion" preference by disabling or
  minimizing decorative animation while keeping all content readable and usable.
- **FR-007**: Both the public site and the back-office editing UI MUST meet WCAG 2.1 AA, including
  full keyboard navigation, a visible focus indicator on every focusable element, color contrast
  meeting AA thresholds (4.5:1 normal text, 3:1 large text and non-text/UI components) in **both the
  dark and paper themes**, and screen-reader labels for interactive and graphical elements.
- **FR-007a**: The page MUST use a correct heading order and landmark regions (e.g., banner,
  navigation, main, contentinfo) so assistive-technology users can navigate by structure.
- **FR-007b**: Any auto-moving content (the logo marquee) MUST provide an accessible mechanism to
  pause/stop it (not hover-only) and MUST stop by default when "reduce motion" is set (WCAG 2.2.2).
- **FR-007c**: Decorative-only enhancements MUST NOT degrade accessibility: the custom cursor MUST
  NOT remove or obscure the native focus indicator or a usable pointer, and desktop-only effects
  (custom cursor, magnetic buttons) MUST be disabled on touch/coarse-pointer devices and when
  "reduce motion" is set. Interactive touch targets MUST be at least 44×44 CSS px.
- **FR-007d**: Interactive components MUST expose correct semantics and state to assistive tech:
  the platform showcase uses tab/tab-panel roles with a clear selected state; the language toggle
  has an accessible name and conveys the active language; the inquiry form's validation errors are
  programmatically associated with their fields and announced.
- **FR-008**: The platform showcase MUST let the visitor switch between the three surfaces and show
  the corresponding example for the selected surface; the first surface is selected by default on
  load.
- **FR-009**: All public-facing text and numbers MUST be sourced from managed content (see CMS
  requirements), not hard-coded, so the site reflects the latest published content.
- **FR-010**: The site MUST provide a clear, working way for a visitor to contact the studio from
  the call-to-action and navigation; this is realized by the on-site inquiry form (FR-022).
- **FR-011**: The site MUST keep an explicit, enumerated set of intentionally English-only labels
  presented consistently with the brand's design intent, while every other human-readable string is
  fully bilingual. The English-only set is exactly: section numbers (01–04), the monospace category
  labels and short category tags (e.g., "Automation", "CRM · Platform", "A · Automation"), KPI/stat
  unit symbols, status pills (e.g., "Healthy", "Running"), brand and client names, and URL/email
  literals. Any string not in this set is treated as translatable prose (FR-002).
- **FR-011c**: Numeric and currency display values (e.g., statistic values, `฿2.4M`, `99.9%`) are
  authored as content per locale; the system is NOT required to auto-reformat numbers/currency to
  locale conventions in this release.
- **FR-011a**: The site MUST expose per-language SEO and social-share metadata (page title, meta
  description, and a social-share/Open Graph image) so search engines and shared links show the
  correct title, description, and preview image for the visitor's language.
- **FR-011b**: The site MUST measure aggregate visitor traffic and key conversions (e.g., inquiry
  submissions) using a privacy-friendly, cookieless method that does not identify individuals, and
  therefore MUST NOT require a cookie-consent banner.

### Functional Requirements — Content Management (CMS)

- **FR-012**: The system MUST require authentication for all back-office access and MUST deny access
  by default to anyone not signed in. All signed-in staff share a single role with full access to
  content management and the inquiry inbox.
- **FR-013**: Editors MUST be able to view and edit the content of every public section, with
  separate English and Thai values for each translatable field.
- **FR-014**: The system MUST prevent publishing any content that is missing its English or its Thai
  value, and MUST clearly indicate what is missing.
- **FR-015a**: Editors MUST be able to edit the site's SEO and social-share metadata (page title,
  meta description, social-share image) with separate English and Thai values.
- **FR-015**: Editors MUST be able to edit singleton content (hero, testimonial, call-to-action,
  footer, section headings) and to fully manage repeatable collections (statistics, capabilities,
  showcase surfaces, case studies, process steps, client logos) — including **adding, removing, and
  reordering** items via an explicit ordering control — with the public site reflecting the new set
  and order after publish. Destructive actions (removing an item) MUST require an explicit
  confirmation step.
- **FR-016**: Published content changes MUST become visible on the public site immediately upon
  publish, without requiring a code change or redeployment.
- **FR-017**: The system MUST distinguish draft from published content, and draft changes MUST NOT
  be visible to public visitors.
- **FR-018**: Editors MUST be able to preview content changes as they will appear on the public site
  before publishing.
- **FR-019**: The system MUST validate content values appropriate to their type (e.g., statistics
  must be valid numbers with their unit/suffix, links must be valid) and reject invalid input with
  an actionable message.
- **FR-020**: The system MUST record who changed published content and when, so changes are
  auditable.
- **FR-020a**: When an editor saves content that another editor changed after they opened it, the
  system MUST detect the conflict, prevent the silent overwrite, and warn the editor that the
  content changed. The warning MUST let the editor load the latest version to review/re-apply their
  changes, and MUST NOT discard the editor's unsaved edits without their acknowledgement.
- **FR-021**: The system MUST protect all back-office actions and content-changing operations
  against unauthorized use and, at minimum, the following web-attack classes: injection (SQL/NoSQL
  and command), cross-site scripting (via output encoding/escaping of all user-supplied content),
  and cross-site request forgery. This list is the minimum required set, consistent with the project
  security principle.
- **FR-021a**: The back office MUST handle authentication failures safely: invalid sign-in attempts
  are rejected with a non-revealing message, repeated failed attempts are rate-limited/locked out,
  and sessions expire after a defined period of inactivity and on sign-out.

### Functional Requirements — Inquiries

- **FR-022**: Visitors MUST be able to submit a project inquiry from the public site, and the system
  MUST confirm receipt to the visitor.
- **FR-023**: The system MUST validate inquiry input and reject incomplete or invalid submissions
  with field-level guidance.
- **FR-024**: Staff MUST be able to view submitted inquiries in the back office, including sender
  details, message, the language the visitor was using, and the time of submission.
- **FR-025**: The system MUST protect the inquiry form against automated abuse/spam using a layered
  mechanism: a privacy-friendly challenge (no personal tracking), a server-side honeypot field, and
  per-IP rate limiting capped at a defined threshold (default: 5 submissions per IP per hour);
  requests exceeding the limit are rejected.
- **FR-026**: The inquiry form MUST require the visitor's explicit consent to store and process their
  personal data before the submission can be sent, and MUST link to a privacy notice describing what
  is collected and why.
- **FR-027**: The system MUST retain inquiry personal data for no longer than 24 months from
  submission and MUST automatically and permanently delete the entire inquiry record once it is
  older than 24 months. (Deletion, not anonymization, is the chosen action — see Clarifications.)
- **FR-027a**: The automatic retention deletion MUST be monitored: a failure of the scheduled
  deletion process MUST raise an alert and the process MUST catch up on the next successful run, so
  records are never silently retained past 24 months.
- **FR-028**: Staff MUST be able to delete an individual's inquiry data on request, fully removing it
  from the back office.
- **FR-029**: When a new inquiry is submitted, the system MUST send an email notification to the
  studio (in addition to storing it in the inbox), and a failure to send the notification MUST NOT
  cause the visitor's submission to be lost.
- **FR-030**: All personal data (inquiries and the back office that stores them) MUST be stored and
  processed in an Asia-Pacific (Singapore) region to satisfy PDPA data-residency, and data in
  transit MUST use TLS.

### Key Entities *(include if feature involves data)*

- **Localized Content Field**: A single editable piece of text or number that has an English value
  and a Thai value; the unit of translation and the unit of the publish-completeness check.
- **Section Content (singleton)**: The content for a one-of-a-kind section (hero, testimonial,
  call-to-action, footer, and each section's heading/subheading), composed of localized fields.
- **SEO Metadata (singleton)**: Per-language page title, meta description, and social-share image
  used for search engines and link previews.
- **Capability**: A capability card — its category label, title, description, and tags — as
  localized fields.
- **Showcase Surface**: One of the platform showcase tabs and its example panel content.
- **Case Study**: A selected-work item — tag, title, description, and result metrics.
- **Process Step**: A step in "how we work" — number, name, title, description, and checklist points.
- **Statistic**: A headline number with its value, unit/suffix, and label.
- **Client Logo**: A name shown in the logo marquee.
- **Editor / Staff User**: A person authorized to sign in and manage content (and view inquiries).
- **Content Version / Change Record**: The published vs. draft state, a version indicator used to
  detect concurrent-edit conflicts on save, and the audit trail of who changed what and when.
- **Media Asset**: An uploaded image (e.g., the social-share/Open Graph image referenced by SEO
  Metadata) stored in the in-region object store, with localized alt text.
- **Inquiry**: A submitted contact request with sender details, message, language, timestamp,
  consent record (that the visitor agreed to data processing, and when), and a retention/expiry basis
  used for automatic removal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can switch between English and Thai and see all narrative content update in
  under 1 second, and the chosen language is still in effect on their next visit.
- **SC-002**: The site displays correctly with no horizontal scrolling, overlap, or clipped text
  across screen widths from 360px to 1440px and above.
- **SC-003**: 100% of published public-facing content has both an English and a Thai value (no
  visitor ever sees a missing-translation placeholder).
- **SC-004**: The site meets WCAG 2.1 AA, verified by a combination of automated checks and manual
  keyboard/screen-reader testing, with zero AA-level blockers.
- **SC-005**: A non-technical editor can update any visible piece of content (text or number) in
  both languages and have it live on the public site within 5 minutes, without developer help and
  without a redeployment.
- **SC-006**: An attempt to publish content missing either language is blocked 100% of the time.
- **SC-007**: The site becomes usable (primary content visible and interactive) within 3 seconds on
  a mid-tier mobile device over a 4G connection.
- **SC-008**: With "reduce motion" enabled, no non-essential animation plays, and all content
  remains fully accessible.
- **SC-009**: At least 95% of valid inquiry submissions are confirmed to the visitor and appear in
  the back office within 1 minute.
- **SC-010**: 100% of stored inquiries have a recorded consent, and no inquiry is retained beyond 24
  months from submission.

## Assumptions

- The approved design in the handoff bundle (`Wrenfield Works - Enterprise.html` and its imported
  styles, script, and bilingual content) is the authoritative visual and content reference; the
  delivered site must match that visual output regardless of the implementation technology.
- The site is a single marketing page composed of the sections listed above; additional marketing
  pages (e.g., blog, individual case-study pages) are out of scope for this release unless requested
  later.
- English is the default language for first-time visitors; Thai is the secondary language.
- Both themes ship this release: dark is the default and the paper/light theme is available via a
  visitor-facing toggle (FR-005b); AA contrast targets apply to both themes (confirmed in
  Clarifications).
- Accessibility scope: WCAG 2.1 AA applies to both the public site and the back-office editing UI
  (FR-007) (confirmed in Clarifications).
- Back-office users are trusted studio staff sharing a single role with full content-management and
  inquiry-inbox access (confirmed in Clarifications); fine-grained roles can be added later.
- Standard, secure authentication for the back office is acceptable (the specific method is an
  implementation detail decided at planning time).
- The brand intentionally keeps certain short technical/monospace labels in English; only narrative
  prose is fully translated.
- Content can be seeded from the approved design's existing English/Thai copy so the public site is
  meaningful before editors make their first change.
