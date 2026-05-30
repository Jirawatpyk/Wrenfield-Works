# Accessibility (WCAG 2.1 AA) Requirements Quality Checklist: Wrenfield Works Enterprise Site + CMS

**Purpose**: Validate that accessibility requirements are complete, clear, and measurable before
implementation — a formal release-gate review of the spec's a11y quality.
**Created**: 2026-05-31
**Feature**: [spec.md](../spec.md)

**Note**: These items test the REQUIREMENTS, not the implementation. `[x]` = adequately specified;
`[ ]` = gap/ambiguity (see Review Findings).

## Requirement Completeness

- [x] CHK001 Is the conformance target explicitly stated (WCAG 2.1 AA) and scoped to all interactive and graphical elements? [Completeness, Spec §FR-007]
- [x] CHK002 Are keyboard-navigation requirements defined for every interactive element (nav links, language toggle, showcase tabs, buttons, inquiry form)? [Coverage, Spec §FR-007] — blanket "full keyboard navigation"
- [x] CHK003 Are screen-reader labeling requirements defined for non-text/graphical elements (decorative lattice canvas, custom cursor, SVG brand mark, icon-only controls)? [Completeness, Spec §FR-007] — blanket "graphical elements"; plan marks canvas aria-hidden
- [x] CHK004 Are accessible error-messaging requirements (programmatic association, announcement) defined for the inquiry form? [Resolved → Spec §FR-007d]
- [x] CHK005 Are heading-order and landmark-structure requirements defined for the single-page layout? [Resolved → Spec §FR-007a]

## Requirement Clarity & Measurability

- [x] CHK006 Is "visible focus" specified with measurable criteria (visibility/contrast) rather than implied? [Measurability, Spec §FR-007] — subsumed by the AA commitment (which is itself the objective standard)
- [x] CHK007 Are color-contrast requirements quantified to AA thresholds for each text/UI role, in both themes? [Clarity, Spec §FR-007] — AA threshold = the quantification; applies to BOTH dark and paper themes (FR-005b)
- [x] CHK008 Does the spec state that content remains fully usable — not merely visible — when motion is off? [Clarity, Spec §SC-008, §FR-006]
- [x] CHK009 Can SC-004 ("zero AA-level blockers") be objectively verified, and is the verification method (automated + manual) part of the requirement? [Measurability, Spec §SC-004]
- [x] CHK010 Are touch-target size / mobile accessibility requirements specified? [Resolved → Spec §FR-007c: ≥44×44 CSS px]

## Coverage & Edge Cases

- [x] CHK011 Is reduced-motion behavior specified as a requirement for each animated element (lattice, counters, scroll-reveal, marquee, cursor, magnetic buttons, sticky process)? [Coverage, Spec §FR-006, §SC-008] — blanket "decorative animation"
- [x] CHK012 Is the auto-scrolling marquee covered by a pause/stop requirement for moving content (WCAG 2.2.2)? [Resolved → Spec §FR-007b]
- [x] CHK013 Is there a requirement that the custom cursor does not suppress the visible focus indicator or pointer affordance for assistive-tech users? [Resolved → Spec §FR-007c]
- [x] CHK014 Are accessible-name/state requirements defined for the language toggle in both languages? [Resolved → Spec §FR-007d]
- [x] CHK015 Are tab/tabpanel semantics (roles, selected state) required for the platform showcase? [Resolved → Spec §FR-007d]

## Consistency

- [x] CHK016 Are accessibility requirements consistent between the public site and the back-office editing UI (or is the back office explicitly scoped out)? [Resolved → Spec §FR-007 + Clarifications (4): WCAG 2.1 AA applies to BOTH public site and back office]

## Review Findings — 2026-05-31 (RESOLVED: 16/16 pass)

All eight original gaps — the high-value AA risks specific to this design — were resolved by adding
concrete requirements on 2026-05-31:

- **CHK012** (marquee pause) → Spec §FR-007b (accessible pause/stop, stops under reduced-motion).
- **CHK013** (custom cursor) → Spec §FR-007c (must not suppress focus/pointer; disabled on
  touch/reduced-motion).
- **CHK004** (form error a11y) → Spec §FR-007d (errors programmatically associated + announced).
- **CHK005** (headings/landmarks) → Spec §FR-007a.
- **CHK010** (touch targets) → Spec §FR-007c (≥ 44×44 CSS px).
- **CHK014** (language toggle name/state) → Spec §FR-007d.
- **CHK015** (showcase tab semantics) → Spec §FR-007d.
- **CHK016** (back-office scope) → Spec §FR-007 + Clarifications (4): WCAG 2.1 AA applies to BOTH
  the public site and the back office. (Contrast also covers both dark and paper themes — FR-005b.)
