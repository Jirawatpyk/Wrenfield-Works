# UX / UI Visual-Fidelity Requirements Quality Checklist: Wrenfield Works Enterprise Site + CMS

**Purpose**: Validate that UX/UI requirements (visual fidelity, states, responsiveness, editor
experience) are complete, clear, and measurable before implementation — a formal release-gate
review of the spec's UX quality.
**Created**: 2026-05-31
**Feature**: [spec.md](../spec.md)

**Note**: These items test the REQUIREMENTS, not the implementation. `[x]` = adequately specified;
`[ ]` = gap/ambiguity (see Review Findings).

## Requirement Completeness

- [x] CHK001 Is the set of visual states (default, hover, focus, active, disabled, error, empty, loading) that each interactive component must define enumerated? [Completeness, Constitution VI]
- [x] CHK002 Are loading-state requirements defined for asynchronous content rendering and for inquiry submission? [Resolved → Spec §FR-005a]
- [x] CHK003 Are empty-state requirements defined for each repeatable section when it has zero published items? [Coverage, Edge Cases]
- [x] CHK004 Are error-state requirements (localized, actionable) defined for both the inquiry form and content-load failure? [Completeness, Edge Cases, §FR-023]
- [x] CHK005 Are requirements for the draft-vs-public preview defined from the editor's UX perspective? [Completeness, Spec §FR-018]
- [x] CHK006 Are add/remove/reorder editing-UX requirements defined (ordering control, delete confirmation, effect on public order)? [Resolved → Spec §FR-015: explicit ordering control + delete confirmation]

## Requirement Clarity & Ambiguity

- [x] CHK007 Is "matching the approved visual design" backed by an authoritative reference and acceptance criteria for what counts as faithful? [Resolved → Spec §FR-001: tokens reproduced exactly + visual review at breakpoints]
- [x] CHK008 Are responsive requirements specified with concrete breakpoint widths rather than "small phones to wide desktops"? [Clarity, Spec §FR-005, §SC-002] — SC-002 gives measurable 360–1440 bounds; exact breakpoints are an implementation detail
- [x] CHK009 Is the platform-showcase interaction clear about the default-selected surface and switching behavior? [Resolved → Spec §FR-008: first surface selected by default]
- [x] CHK010 Is "a clear, working way to contact" specified concretely (form fields, confirmation copy) rather than vague? [Clarity, Spec §FR-010, §FR-022, data-model §Inquiry]
- [x] CHK011 Is the concurrent-edit conflict-warning UX defined enough to design its message and recovery flow? [Resolved → Spec §FR-020a: load-latest + re-apply, no discard without acknowledgement]
- [x] CHK012 Is the dark-vs-paper theme scope unambiguous (which is in scope; is the toggle a visitor feature; does paper ship at all)? [Resolved → Spec §FR-005b + Clarifications (4): both dark (default) and paper ship, with a persistent visitor toggle]

## Measurability / Acceptance Criteria

- [x] CHK013 Can SC-005 (editor updates content live within 5 minutes, no developer help) be objectively measured, and are its preconditions defined? [Measurability, Spec §SC-005]
- [x] CHK014 Is SC-007 ("usable within 3 seconds") scoped consistently (connection type, which content counts as usable)? [Clarity, Spec §SC-007] — plan quantifies (mid-tier mobile/4G)
- [x] CHK015 Is "very long translated text must not break layout" expressed with a measurable bound? [Resolved → Spec Edge Cases: up to +50% length]
- [x] CHK016 Is SC-002 (no horizontal scroll/overlap/clipping, 360px–1440px+) verifiable across the stated range? [Measurability, Spec §SC-002]

## Coverage & Edge Cases

- [x] CHK017 Are mobile behaviors of desktop-only effects (custom cursor, magnetic buttons) specified as requirements (disabled/alternative)? [Resolved → Spec §FR-007c: disabled on touch/coarse-pointer]
- [x] CHK018 Are requirements defined for a slow/failed content load producing a graceful state rather than a broken page? [Coverage, Edge Cases]
- [x] CHK019 Is the visual treatment for the intentional English-only technical labels specified so it reads as deliberate, not untranslated? [Consistency, Spec §FR-011]

## Review Findings — 2026-05-31 (RESOLVED: 19/19 pass)

All eight original gaps were resolved by spec edits on 2026-05-31:

- **CHK012** (theme scope) → Spec §FR-005b + Clarifications (4): both dark (default) and paper ship
  with a persistent visitor toggle; AA contrast applies to both.
- **CHK007** (fidelity criteria) → Spec §FR-001: tokens reproduced exactly + visual review at the
  defined breakpoints.
- **CHK002** (loading states) → Spec §FR-005a.
- **CHK006** (reorder/delete UX) → Spec §FR-015: explicit ordering control + delete confirmation.
- **CHK009** (showcase default) → Spec §FR-008: first surface selected by default.
- **CHK011** (conflict recovery) → Spec §FR-020a: load latest + re-apply, no silent discard.
- **CHK015** (long-text bound) → Spec Edge Cases: up to +50% length.
- **CHK017** (desktop-only effects on mobile) → Spec §FR-007c: disabled on touch/coarse-pointer.
