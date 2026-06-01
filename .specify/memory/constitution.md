<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.0.1
Rationale: PATCH — wording clarifications and a template-alignment fix; no principle
added, removed, or redefined.

1.0.0 → 1.0.1 changes:
  - Resolved a conflict between Principle II (TDD) and tasks-template.md, which
    declared tests OPTIONAL. tasks-template.md updated to make tests mandatory.
  - Principle IV (UX): removed localization wording that duplicated Principle III;
    now references Principle III instead of restating it.
  - Principle VII / Test gate: replaced "coverage MUST NOT decrease" with an explicit
    per-module minimum coverage baseline (enforceable from v1 with no prior baseline).
  - Governance: named the approving authority (project maintainer(s)).

Principles defined (7):
  I.   Security — NON-NEGOTIABLE
  II.  Test-First Development (TDD) — NON-NEGOTIABLE
  III. Internationalization (TH/EN)
  IV.  User Experience (UX)
  V.   Stability & Performance
  VI.  User Interface (UI)
  VII. Code Quality Standards

Sections:
  - Core Principles (7 principles)
  - Additional Constraints & Quality Gates
  - Development Workflow & Review Process
  - Governance

Removed sections: none

Template alignment:
  ✅ .specify/templates/plan-template.md   — "Constitution Check" gate is generic; principles below provide concrete gates. No edit required.
  ✅ .specify/templates/spec-template.md   — Mandatory sections (Scenarios, Requirements, Success Criteria) compatible with principles. No edit required.
  ✅ .specify/templates/tasks-template.md  — UPDATED in 1.0.1: tests changed from OPTIONAL to mandatory (test-first) to satisfy Principle II.

Follow-up TODOs:
  - Ratification date is set to 2026-05-31 (date of initial adoption). Update if the
    official adoption date differs.
-->

# Wrenfield Works Constitution

## Core Principles

### I. Security (NON-NEGOTIABLE)

Security MUST be designed in from the first line of code, not added afterward.

- All external input (HTTP requests, file uploads, CLI args, env vars, third-party
  responses) MUST be validated and sanitized before use; never trust client data.
- Secrets (API keys, tokens, credentials) MUST NOT be hardcoded or committed to the
  repository; they MUST be supplied via environment variables or a secrets manager.
- Authentication and authorization MUST be enforced on every protected resource;
  deny-by-default is the rule, allow is the exception.
- Data in transit MUST use TLS; sensitive data at rest MUST be encrypted or hashed
  (passwords with a modern adaptive hash, never plaintext or fast hashes).
- Dependencies MUST be scanned for known vulnerabilities, and high/critical findings
  MUST be resolved before release.

**Rationale**: A single security defect can compromise every user and erase trust
permanently. Threats are cheaper to prevent at design time than to remediate in
production.

### II. Test-First Development (TDD) (NON-NEGOTIABLE)

Tests MUST be written before the implementation they verify.

- The Red-Green-Refactor cycle is mandatory: write a failing test, confirm it fails,
  implement the minimum to pass, then refactor.
- Every bug fix MUST begin with a failing test that reproduces the bug.
- No implementation code is merged without accompanying tests that would fail if the
  behavior regressed.
- Contract and integration tests MUST exist for new public interfaces and
  cross-component communication.

**Rationale**: Writing tests first forces clear requirements, prevents untestable
designs, and gives a regression safety net that lets the system change safely.

### III. Internationalization (TH/EN)

The product MUST support Thai (TH) and English (EN) as first-class languages.

- User-facing strings MUST NOT be hardcoded; they MUST come from i18n resource files
  keyed by locale.
- Both TH and EN translations MUST be present for every user-facing string before a
  feature is considered complete.
- Date, time, number, and currency formatting MUST respect the active locale.
- Text rendering, input handling, and layout MUST correctly support Thai characters
  (including combining marks) and MUST NOT break with longer translated strings.

**Rationale**: Bilingual support is a core market requirement; retrofitting i18n after
strings are scattered through the code is costly and error-prone.

### IV. User Experience (UX)

Every feature MUST deliver a clear, predictable, and accessible experience.

- User flows MUST minimize required steps; the primary task of each screen MUST be
  achievable without hidden knowledge.
- The system MUST give explicit, actionable feedback for loading, success, and error
  states — no silent failures.
- Error messages MUST be human-readable and actionable, telling the user what happened
  and what to do next (localization is governed by Principle III).
- Interfaces MUST meet WCAG 2.1 AA accessibility expectations (keyboard navigation,
  color contrast, screen-reader labels).

**Rationale**: A correct system that users cannot understand or operate has failed its
purpose. Consistency and feedback reduce support load and build trust.

### V. Stability & Performance

The system MUST remain reliable under expected load and degrade gracefully under stress.

- Performance budgets MUST be defined per feature (e.g., API p95 latency, page load,
  memory) and verified before release; regressions MUST be justified or fixed.
- Errors MUST be handled explicitly; the system MUST fail safe and surface diagnosable
  errors rather than crash or corrupt data.
- Structured logging and observability (metrics/traces for critical paths) MUST be in
  place so production issues are diagnosable.
- External calls MUST have timeouts and sensible retry/fallback behavior; a single slow
  dependency MUST NOT cascade into a full outage.

**Rationale**: Reliability and speed are features users feel directly; instability erodes
trust faster than missing functionality.

### VI. User Interface (UI)

The UI MUST be consistent, reusable, and responsive across supported devices.

- UI MUST be built from a shared, reusable component library; one-off duplicated
  components are prohibited when a shared component exists or can be generalized.
- A single design system (tokens for color, spacing, typography) MUST be the source of
  truth; ad-hoc inline styling that bypasses tokens is prohibited.
- Layouts MUST be responsive and verified on the supported range of screen sizes.
- Visual states (default, hover, focus, active, disabled, error, empty, loading) MUST be
  defined for interactive components.

**Rationale**: A consistent component-driven UI accelerates development, reduces visual
bugs, and gives users a coherent experience across the product.

### VII. Code Quality Standards

Code MUST be readable, modular, and maintainable.

- The codebase MUST be organized into clear, well-bounded modules with single
  responsibilities; tangled cross-module dependencies are prohibited.
- Linting and formatting MUST pass in CI; merges with lint/format failures are blocked.
- Every change MUST be reviewed by at least one other person (or a recorded equivalent)
  before merge.
- Public functions, modules, and non-obvious logic MUST be documented; dead code and
  commented-out blocks MUST be removed rather than shipped.
- Reusability is preferred over duplication: shared logic MUST be extracted rather than
  copied.

**Rationale**: Code is read far more often than it is written; clear, modular code keeps
the cost of change low as the system and team grow.

## Additional Constraints & Quality Gates

These constraints apply across all features and are enforced at the gates below:

- **Security gate**: dependency vulnerability scan passes (no unresolved high/critical);
  no secrets in source.
- **Test gate**: all tests pass; new/changed behavior has tests written test-first; a
  minimum coverage baseline MUST be defined per module, and coverage MUST NOT fall
  below that baseline without recorded justification.
- **i18n gate**: no hardcoded user-facing strings; TH and EN translations complete.
- **Performance gate**: defined performance budgets met; no unjustified regressions.
- **Quality gate**: lint, format, and type checks pass; code review approved.

A feature is "Done" only when every applicable gate above passes.

## Development Workflow & Review Process

- Work proceeds through the Spec Kit flow: `constitution → specify → clarify → plan →
  tasks → implement`, with each artifact subject to the Constitution Check.
- The "Constitution Check" in the plan template MUST evaluate the feature against all
  seven principles; any violation MUST be recorded in Complexity Tracking with a
  justification and the rejected simpler alternative, or the plan MUST be revised.
- All changes MUST go through pull request review; reviewers MUST verify principle
  compliance, not only correctness.
- CI MUST enforce the automated gates (security scan, tests, lint/format/type, i18n
  checks where automatable); a red pipeline blocks merge.

## Governance

This constitution supersedes all other development practices. Where another document or
habit conflicts with it, this constitution prevails (subject only to explicit, recorded
user instructions).

- **Amendments**: Changes to this constitution MUST be proposed in writing, reviewed,
  and approved by the project maintainer(s) before taking effect. Each amendment MUST
  update the version and the Last Amended date and record its impact in the Sync Impact
  Report.
- **Versioning policy** (semantic versioning):
  - **MAJOR**: backward-incompatible governance changes, or removal/redefinition of a
    principle.
  - **MINOR**: a new principle or section is added, or guidance is materially expanded.
  - **PATCH**: clarifications, wording, or non-semantic refinements.
- **Compliance review**: Every plan and pull request MUST verify compliance with these
  principles. Unjustified violations MUST be remediated before merge. Justified
  exceptions MUST be documented in the feature's Complexity Tracking.

**Version**: 1.0.1 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
