# Security & PDPA Requirements Quality Checklist: Wrenfield Works Enterprise Site + CMS

**Purpose**: Validate that security and PDPA/privacy requirements are complete, clear, consistent,
and measurable before implementation — a formal release-gate review of the spec's security quality.
**Created**: 2026-05-31
**Feature**: [spec.md](../spec.md)

**Note**: These items test the REQUIREMENTS, not the implementation. `[x]` = adequately specified;
`[ ]` = gap/ambiguity (see Review Findings).

## Requirement Completeness

- [x] CHK001 Are authentication requirements defined for ALL back-office surfaces (admin UI, content APIs, inquiry read) with deny-by-default stated explicitly? [Completeness, Spec §FR-012]
- [x] CHK002 Are input-validation requirements defined for every external input surface (inquiry form, content fields, link/URL fields)? [Coverage, Spec §FR-019, §FR-023]
- [x] CHK003 Is the consent record's content defined (what is agreed to, timestamp) and is consent a hard precondition to submit? [Completeness, Spec §FR-026, data-model §Inquiry]
- [x] CHK004 Are requirements defined for the data-subject deletion-on-request flow (scope, completeness, who can perform it, audit)? [Completeness, Spec §FR-028]
- [x] CHK005 Are the privacy-notice content and its linkage from the inquiry form specified as requirements? [Completeness, Spec §FR-026]
- [x] CHK006 Are secret-handling (no secrets in source) and TLS-in-transit requirements stated at requirement level? [Gap] — in plan.md + Constitution I
- [x] CHK007 Is data-residency (PDPA, in-region storage) captured as a requirement, or only in the plan? [Resolved → Spec §FR-030]

## Requirement Clarity & Ambiguity

- [x] CHK008 Are the specific web-attack classes to defend against enumerated (injection, CSRF, XSS) or only referenced generically? [Resolved → Spec §FR-021: injection, XSS, CSRF as minimum set]
- [x] CHK009 Is "remove or anonymize" defined precisely — which fields are deleted versus anonymized? [Resolved → Spec §FR-027: permanent deletion of the whole record]
- [x] CHK010 Is the email-failure-isolation requirement explicit that a failed notification never loses or rolls back the stored inquiry? [Clarity, Spec §FR-029]
- [x] CHK011 Are audit-trail requirements (who changed what, when) specified with enough detail to be verifiable? [Clarity, Spec §FR-020]

## Requirement Consistency

- [x] CHK012 Is the retention period consistently stated as 24 months across FR-027 and SC-010 (no conflicting values)? [Consistency, Spec §FR-027, §SC-010]
- [x] CHK013 Is the cookieless-analytics requirement consistent with the PDPA stance (no personal identifiers, no consent banner)? [Consistency, Spec §FR-011b]
- [x] CHK014 Is the single-role access decision consistent with least-privilege for personal-data (inbox) access, or is the trade-off documented? [Assumption, Clarifications]

## Measurability / Acceptance Criteria

- [x] CHK015 Are spam/abuse protection requirements measurable (mechanism + rate-limit thresholds) rather than vague? [Resolved → Spec §FR-025: challenge + honeypot + 5/IP/hour]
- [x] CHK016 Can SC-006 (publish-with-missing-language blocked 100%) be objectively measured? [Measurability, Spec §SC-006]
- [x] CHK017 Can SC-010 (100% inquiries have consent; none retained beyond 24 months) be objectively measured? [Measurability, Spec §SC-010]

## Coverage & Exception Flows

- [x] CHK018 Does the spec define authentication failure handling (invalid login, lockout, session expiry)? [Resolved → Spec §FR-021a]
- [x] CHK019 Are requirements defined for what happens to in-flight/stored data if the retention job fails to run? [Resolved → Spec §FR-027a: monitored, alert + catch-up]
- [x] CHK020 Are requirements defined for dependency vulnerability handling (no unresolved high/critical) as a release gate? [Gap, Constitution I] — in plan.md + Constitution I

## Review Findings — 2026-05-31 (RESOLVED: 20/20 pass)

All six original gaps were resolved by spec edits on 2026-05-31:

- **CHK007** → Spec §FR-030 (data residency elevated to a spec requirement; TLS in transit).
- **CHK009** → Spec §FR-027 (permanent deletion of the whole record at 24 months — no ambiguity).
- **CHK015** → Spec §FR-025 (challenge + honeypot + 5 submissions/IP/hour).
- **CHK008** → Spec §FR-021 (injection, XSS/output-encoding, CSRF named as the minimum set).
- **CHK018** → Spec §FR-021a (non-revealing failure message, lockout/rate-limit, session expiry).
- **CHK019** → Spec §FR-027a (retention job monitored; alert + catch-up on failure).
