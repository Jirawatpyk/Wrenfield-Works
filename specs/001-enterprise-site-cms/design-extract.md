# Wrenfield Works — Enterprise Site Design Extract (Authoritative Reference)

> Source of truth for pixel-perfect reproduction of the approved prototype **and** for seeding
> bilingual (EN/ไทย) CMS content. Extracted **verbatim** from the design handoff:
> `docs/Frist Pilot-handoff/frist-pilot/project/` (`Wrenfield Works - Enterprise.html`,
> `enterprise.css`, `enterprise.js`, `i18n.js`, `assets/*.svg`).
>
> The default ("enterprise") theme is **dark**. A **paper/light** theme override exists
> (`body.paper`) but, importantly, **there is no UI toggle for it in the prototype** — see
> §1 and the Ambiguities note at the end. The brand "voice of systems" keeps mono/technical
> labels in **English only** by design (see §7).

---

## 0. Asset inventory (`project/assets/`)

| File | Size | Purpose |
|------|------|---------|
| `favicon.svg` | 591 B | Browser favicon. Rounded-square (`rx=22`) ink tile `#15181D` with the brass "W" lattice mark (`#CBA265`, `stroke-width 6.2`, five `r=5` solid node dots). Referenced by `<link rel="icon">`. |
| `lattice.svg` | 770 B | Tileable lattice **pattern** (80×48, `patternUnits=userSpaceOnUse`): a zig-zag polyline `0,36 20,12 40,36 60,12 80,36` stroked `#B5894A` (1.4px, opacity .4) with 2.3r `#B5894A` node dots (opacity .5). The static/background expression of the brand motif (the animated version is the JS lattice canvas). |
| `lockup-on-dark.svg` | 12 KB | Full brand lockup (mark + wordmark) intended for dark backgrounds. Largest asset; the complete logo lockup. (Not inlined in the HTML — HTML uses the inline `#mark` symbol + text wordmark instead.) |
| `mark-brass.svg` | 584 B | The "W" mark in brass for dark surfaces: polyline `24,34 38,66 50,44 62,66 76,34` (`#CBA265`, sw 3.4), four solid `r=4` `#CBA265` dots + one hollow `r=5.4` ring (sw 2.6) at the center vertex. This is the canonical mark geometry reused everywhere. |
| `mark-ink.svg` | 584 B | Same mark geometry for **light/paper** surfaces: polyline + outer dots are ink `#15181D`; only the center ring stays brass `#B5894A`. The paper-theme counterpart to `mark-brass.svg`. |

> The HTML defines the mark once as an inline SVG `<symbol id="mark">` (viewBox 0 0 100 100) and
> `<use href="#mark"/>` it in the nav brand, hero (animated draw-on copy), testimonial, and footer.
> Geometry: `polyline points="24,34 38,66 50,44 62,66 76,34"` sw `3.4`; four solid `r=4` dots at the
> outer points; one hollow center circle `cx=50 cy=44 r=5.4` sw `2.6`. Color is `currentColor`.

---

## 1. Design Tokens (verbatim)

### 1.1 `:root` — default DARK ("enterprise") theme

All custom properties exactly as declared in `enterprise.css` lines 7–41.

```css
:root{
  /* base palette */
  --ink:#15181D; --ink-2:#1E242C; --ink-3:#252C35;
  --paper:#ECE5D8; --paper-2:#F5F0E6;
  --brass:#B5894A; --brass-lt:#CBA265; --slate:#6E747C;

  /* font stacks */
  --serif:'Fraunces','Trirong',Georgia,serif;
  --sans:'Hanken Grotesk','Anuphan',sans-serif;
  --mono:'JetBrains Mono','IBM Plex Sans Thai',monospace;

  /* radii */
  --r-sm:8px; --r-md:13px; --r-lg:15px; --r-xl:16px; --r-pill:999px;

  /* spacing scale */
  --s-1:6px; --s-2:10px; --s-3:14px; --s-4:18px; --s-5:24px;
  --s-6:32px; --s-7:46px; --s-8:64px; --s-section:104px;

  /* motion */
  --ease:cubic-bezier(.2,.7,.2,1);
  --dur:.4s;

  /* semantic — DARK (default) */
  --bg:var(--ink);
  --bg-2:var(--ink-2);
  --bg-3:var(--ink-3);
  --fg1:var(--paper);
  --fg2:rgba(236,229,216,.82);
  --fg3:var(--slate);
  --accent:var(--brass-lt);
  --accent-deep:var(--brass);
  --line:rgba(236,229,216,.14);
  --line-strong:rgba(236,229,216,.22);
  --nav-bg:rgba(21,24,29,.72);
  --nav-bg-scrolled:rgba(21,24,29,.9);
  --card-grad:linear-gradient(180deg,rgba(255,255,255,.014),transparent);

  /* tweak-driven (controlled by the React tweaks panel, not shipped) */
  --tx-grain:.04;     /* grain opacity */
  --tx-lattice:1;     /* lattice opacity multiplier */
  --accent-h:36;      /* accent warmth, unused directly but for ref */
}
```

**Naming note (important for reimplementation):** the brief asked for `--ink-soft`,
`--paper-dim`, `--brass-bright`, `--muted`, `--muted-soft`, `--r`, `--maxw`, `--pad`,
`--font-sans/serif/mono`, `--th-sans`, `--th-serif`. **Those exact names do NOT exist in this
prototype.** The actual equivalents are:

| Brief-expected name | Actual token in prototype | Value |
|---|---|---|
| `--ink-soft` | `--ink-2` (+ `--ink-3`) | `#1E242C` / `#252C35` |
| `--paper-dim` | `--paper-2` | `#F5F0E6` |
| `--brass-bright` | `--brass-lt` | `#CBA265` |
| `--muted` / `--muted-soft` | `--slate` / `--fg3` | `#6E747C` |
| `--r` | `--r-sm/md/lg/xl/pill` | 8 / 13 / 15 / 16 / 999px |
| `--maxw` | hard-coded in `.wrap` | `max-width:1180px` (`.wrap-tight` = 1080px) |
| `--pad` | hard-coded in `.wrap` | `padding:0 48px` (→ `0 24px` ≤820px) |
| `--font-sans/serif/mono` | `--sans` / `--serif` / `--mono` | see above |
| `--th-sans` / `--th-serif` | none (Thai is folded into the same stacks) | Thai = 2nd family in each stack (`Anuphan`, `Trirong`, `IBM Plex Sans Thai`) |

There is **no separate Thai font stack variable**; Thai fonts are appended as fallbacks inside
the single `--serif`/`--sans`/`--mono` stacks. There is **no semantic `--positive` token**;
`#86B88A` (mint/green) is used inline for the "ok" pill and trust dot via
`var(--positive,#86B88A)` (fallback only — the variable itself is never defined).

### 1.2 `body.paper` — PAPER / LIGHT theme override (lines 44–58)

This override is **partial**: it re-points **12 semantic variables only**. It does NOT touch the
base palette (`--ink*`, `--paper*`, `--brass*`, `--slate`), radii, spacing, fonts, easing, or the
tweak variables — those are inherited unchanged.

```css
body.paper{
  --bg:var(--paper);              /* #ECE5D8 */
  --bg-2:var(--paper-2);          /* #F5F0E6 */
  --bg-3:#FBF7EE;                 /* literal — lighter than paper-2 */
  --fg1:var(--ink);               /* #15181D */
  --fg2:rgba(21,24,29,.78);
  --fg3:#7C7568;                  /* literal warm grey */
  --accent:var(--brass);          /* #B5894A (darker accent for contrast on light) */
  --accent-deep:#9A7338;          /* literal — darker brass */
  --line:rgba(21,24,29,.14);
  --line-strong:rgba(21,24,29,.20);
  --nav-bg:rgba(236,229,216,.74);
  --nav-bg-scrolled:rgba(236,229,216,.92);
  --card-grad:linear-gradient(180deg,rgba(21,24,29,.018),transparent);
}
```

**Variables the paper theme overrides (12):** `--bg`, `--bg-2`, `--bg-3`, `--fg1`, `--fg2`,
`--fg3`, `--accent`, `--accent-deep`, `--line`, `--line-strong`, `--nav-bg`, `--nav-bg-scrolled`,
`--card-grad`. (13 lines; that is the full list.)

**Variables the paper theme does NOT override (will keep dark-theme/base values):**
`--tx-grain`, `--tx-lattice`, `--accent-h`, all radii, all spacing, all fonts, `--ease`, `--dur`,
and every base-palette literal. Hard-coded colors that **do not adapt** to paper theme (these are
literals in component rules, not tokens — flag for the CMS reimplementation): the lattice canvas
brass `rgba(181,137,74,*)` / `rgba(203,162,101,*)` / `rgba(232,205,150,*)`, the `#86B88A` mint
(ok pill, code string `.st`, trust dot, top-performer pill), the cursor-ring border
`rgba(203,162,101,.6/.9)`, hero-glow `rgba(181,137,74,.10/.05)`, and the card-hover radial
`rgba(181,137,74,.07)`.

---

## 2. Typography

### 2.1 Google Fonts import (verbatim, `enterprise.css` line 1)

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..500&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Trirong:wght@400;500;600&family=Anuphan:wght@400;500;600&family=IBM+Plex+Sans+Thai:wght@400;500&display=swap');
```

| Family | Axes / weights imported | Role |
|--------|------------------------|------|
| **Fraunces** (Latin serif, variable) | `ital,opsz,wght@0,9..144,400..600;1,9..144,400..500` — optical-size 9–144, weight 400–600 upright / 400–500 italic | Display & headings (`--serif` primary). Uses `font-variation-settings 'opsz'`/`'wght'` animation on hover/reveal (see below). |
| **Hanken Grotesk** (Latin sans) | `400;500;600;700` | Body / UI text (`--sans` primary). |
| **JetBrains Mono** (Latin mono) | `400;500` | Mono/technical labels: kickers, section numbers, tags, pills, code, footer meta (`--mono` primary). |
| **Trirong** (Thai serif) | `400;500;600` | Thai serif fallback inside `--serif` (Thai display/headings). |
| **Anuphan** (Thai sans) | `400;500;600` | Thai sans fallback inside `--sans` (Thai body). |
| **IBM Plex Sans Thai** (Thai) | `400;500` | Thai fallback inside `--mono` (Thai mono-context text). |

Stacks: `--serif:'Fraunces','Trirong',Georgia,serif` · `--sans:'Hanken Grotesk','Anuphan',sans-serif`
· `--mono:'JetBrains Mono','IBM Plex Sans Thai',monospace`.

### 2.2 Type scale (verbatim from CSS)

| Selector | font-family | weight | font-size | line-height | letter-spacing | other |
|---|---|---|---|---|---|---|
| `body` | `--sans` | — | (15px default via `p`) | `1.6` | — | antialiased |
| `h1,.h1` | `--serif` | 500 | `clamp(40px,7vw,86px)` | `1.04` | `-.028em` | `h1 em` = italic, `--accent`, wght 400 |
| `h2,.h2` | `--serif` | 500 | `clamp(30px,4.4vw,52px)` | `1.04` | `-.02em` | `h2 em` = italic, `--accent`, wght 400 |
| `h3,.h3` | `--serif` | 500 | `23px` | `1.2` | `-.005em` | |
| `.lead` | `--sans` | — | `clamp(16px,1.5vw,19px)` | `1.66` | — | color `--fg2` |
| `p` | `--sans` | — | `15px` | `1.62` | — | color `--fg2` |
| `.kicker` | `--mono` | — | `11px` | — | `.26em` | uppercase, `--accent` |
| `.kicker-th` | `--mono` | — | `11px` | — | `.12em` | `--accent` (Thai kicker variant) |
| `.label` | `--mono` | — | `10px` | — | `.2em` | uppercase, `--fg3` |
| `.num` | `--mono` | — | `12px` | — | `.1em` | `--accent-deep` |
| hero `.sub-th` | `--sans` | — | `16px` | `1.7` | — | `--fg2` (Thai subline) |
| `.stat-cell .v` | `--serif` | 500 | `clamp(40px,4.4vw,58px)` | `1` | `-.03em` | `.u` = `--accent`, italic |
| `.process-sticky .big-n` | `--serif` italic | 400 | `clamp(120px,16vw,220px)` | `.8` | `-.04em` | `--accent` |
| `.quote-blk blockquote` | `--serif` | 500 | `clamp(24px,3.2vw,38px)` | `1.32` | `-.015em` | `em` italic `--accent` |
| `.cta-sec h2` (override) | `--serif` | 500 | `clamp(34px,5.2vw,62px)` | (h2) | (h2) | margin-bottom 18px |
| `.logo-item` | `--serif` | 500 | `24px` | — | `-.01em` | opacity .55 → 1 on hover |
| `.mock-kpi .mv` | `--serif` | 500 | `30px` | — | `-.02em` | |
| `.case .glyph` | `--serif` italic | — | `54px` | — | — | `--accent`, opacity .9 |

**Variable-font (`opsz`/`wght`) animations** (Fraunces optical size grows on reveal/hover):
- `.sec-head h2`: rest `'opsz' 36,'wght' 500` → on `.sec-head.in`: `'opsz' 144,'wght' 500` (1.1s ease)
- `.brand .bn`: rest `'opsz' 30,'wght' 500` → hover `'opsz' 120,'wght' 560` (.5s)
- `.cap h3`: rest `'opsz' 32,'wght' 500` → hover `'opsz' 144,'wght' 560`
- `.case h4`: rest `'opsz' 30,'wght' 500` → hover `'opsz' 144,'wght' 560`

### 2.3 Thai-specific overrides

- `body.lang-th .hero h1` (line 170): `line-height:1.26; font-size:clamp(34px,6vw,74px); letter-spacing:normal`
  — Thai gets **more leading, a smaller display size, and no negative tracking** (Latin hero h1 is
  `clamp(40px,7vw,86px)` with `-.028em`).
- The `.kicker-th` class (line 89) reduces kicker tracking from `.26em` → `.12em` for Thai.
- The `body.lang-th` class is toggled by `i18n.js` (`applyLang`); `document.documentElement.lang`
  is also set to `en`/`th`. There is **no `:lang(th)` or `[lang="th"]` selector**; Thai styling is
  driven entirely by the `body.lang-th` class and the font-stack fallbacks. (The `.sub-th`,
  `.k-th`, `.th` helper classes exist in CSS but the shipped HTML does not currently render
  separate Thai sub-lines — translation happens in-place by swapping `innerHTML`.)

---

## 3. Section-by-section structure (document order)

Container widths: `.wrap` = `max-width:1180px; padding:0 48px`; `.wrap-tight` = `max-width:1080px`.
All anchored sections have `scroll-margin-top:92px` (fixed-nav offset). Section vertical rhythm:
`section.blk` = `padding:var(--s-section) 0` (104px; → 76px ≤820px).

### 3.0 Global overlays (top of `<body>`)
- Inline `<svg>` with `<symbol id="mark">` (hidden defs) — the reusable brand mark.
- `<div class="cursor-dot">` + `<div class="cursor-ring">` — custom cursor (fixed, z 9500, `mix-blend-mode:difference`; hidden ≤900px).
- `body::before` — fixed full-screen SVG fractal-noise **grain** overlay, `opacity:var(--tx-grain)` (.04), `mix-blend-mode:overlay`, z 9000.

### 3.1 NAV — `<nav id="nav">`
- `.wrap` is `display:flex; justify-content:space-between; height:74px`.
- `.brand` (`#top` anchor): inline mark `.mk` (32×32, `color:var(--accent-deep)`) + `.bn` wordmark "Wrenfield **Works**" (serif 18px; "Works" in `--accent-deep`).
- `.nav-links` (flex, gap 34px): four `a.lk` anchors → `#capabilities #platform #work #process` (`data-i18n="nav_cap|nav_platform|nav_work|nav_process"`); `.lang-tog` group (two `<button data-lang="en"|"th">`, EN active `.on`); `.btn` CTA `#contact` (`data-magnetic`, `data-i18n="nav_cta"`).
- Underline-on-hover on `a.lk` via `::after` (width 0→100%).
- Position fixed, `backdrop-filter:blur(12px)`, `background:var(--nav-bg)`. On scroll >24px JS adds `.scrolled` → border-bottom + `--nav-bg-scrolled`.
- Responsive: ≤1080px nav-links gap→24px and `.lang-tog` hidden; ≤920px `.lk` hidden; ≤900px both `.lk` and `.lang-tog` hidden (collapses to brand + CTA only — **no hamburger menu in the prototype**).

### 3.2 HERO — `<header class="hero" id="top">`
- `min-height:100vh; display:flex; align-items:center; padding:100px 0 120px; overflow:hidden`.
- `<canvas id="hero-canvas">` — animated lattice, `opacity:calc(.9*var(--tx-lattice))`, radial mask `78% 78% at 72% 38%`.
- `.hero-glow` — two radial brass glows (`78% 30%` .10, `12% 80%` .05); subtle scroll parallax (`translateY(scrollY*.12)`).
- `.wrap` (z 3): animated `.hero-mk.draw` mark (62×62, `--len:140` draw-on); `.kicker.reveal` "AI-assisted systems, built right." (**static EN, no data-i18n**); `<h1 class="hero-h1" data-i18n="hero_h1">`; `.sub.lead.reveal[data-i18n="hero_sub"]`; `.cta.reveal` with two buttons (`.btn.solid` → `#work`, `.btn` → `#contact`, both `data-magnetic`, **static EN labels "See selected work" / "Start a project"**); `.trust.reveal` with `.dot` + `span[data-i18n="hero_trust"]`.
- `.scroll-hint` (absolute bottom center): "Scroll" + animated `.ln` (scrolldn keyframe). Hidden ≤820px or ≤760px tall.
- `.hero h1`: `max-width:15ch; word-spacing:.22em`. Headline is split into per-word `<span class="word"><span class="w-in">` by JS for staggered rise+fade reveal (52ms/word).

### 3.3 LOGO MARQUEE — `<div class="marquee-sec">`
- `padding:42px 0`; top+bottom hairline borders.
- `.marquee-head` (mono 11px, `.2em`, uppercase, centered): **bilingual literal in markup** — `Systems shipped for teams across industries · ระบบที่ส่งมอบให้ทีมในหลากหลายอุตสาหกรรม` (NOT data-i18n; both languages shown at once).
- `.marquee` with edge gradient mask (`90deg, transparent → #000 12%..88% → transparent`). Two identical `.marquee-track` (second `aria-hidden`) animate `translateX(-100%)` over `38s linear infinite`; `animation-play-state:paused` on hover.
- Each track has 8 `.logo-item` (serif 24px, opacity .55→1 hover): `Northbound®` (® in `.tm`), `Siriphan Group`, `Halcyon Labs`, `Meridian Freight`, `Kasem & Co.`, `Atlas Retail`, `Verdant Health`, `Rung Capital`.

### 3.4 STATS — `<section class="blk no-rule" id="stats">` (`border-top:none`)
- `.stats.reveal[data-stagger]`: `grid-template-columns:repeat(4,1fr)`, bordered, `--r-lg`, `--card-grad`. Each `.stat-cell` has `padding:40px 32px` + right hairline (last none).
- 4 cells, each `.v` = `<span data-count>0</span><span class="u">…</span>` + `.k[data-i18n]`:
  1. count `60`, unit `+`, `stat1_k`
  2. count `40`, unit `%`, `stat2_k`
  3. count `10`, unit `×`, `stat3_k`
  4. count `100`, unit `%`, `stat4_k`
- Responsive: ≤820px → 2 columns (cells 1&2 get bottom border, cell 2 loses right border).

### 3.5 CAPABILITIES — `<section class="blk" id="capabilities">`
- `.sec-head.reveal`: `.n` "**01**" (mono, `--accent-deep`) + `.ht` (`h2[data-i18n="sec1_h2"]` + `.sec-sub[data-i18n="sec1_sub"]`).
- `.cap-grid[data-stagger]`: `grid-template-columns:repeat(2,1fr); gap:18px` (→ 1col ≤820px).
- 4 `.cap` cards, each: inline `.ic` SVG (46×46, `--accent`), `.cn` mono category tag, `h3[data-i18n]`, `p[data-i18n]`, `.meta` mono tag row. Hover: lift `-4px`, brass border, radial glow `::after`.
  - Card 1: cn "Automation" / `cap1_h3` / `cap1_p` / meta `ระบบอัตโนมัติ · Integrations · Reporting bots`
  - Card 2: cn "Tools" / `cap2_h3` / `cap2_p` / meta `เครื่องมือภายใน · Dashboards · Admin`
  - Card 3: cn "Systems" / `cap3_h3` / `cap3_p` / meta `ระบบเฉพาะทาง · CRM · Portals`
  - Card 4: cn "Leverage" / `cap4_h3` / `cap4_p` / meta `ใช้ AI เป็นเลเวอเรจ · Quality first`

### 3.6 PLATFORM SHOWCASE — `<section class="blk" id="platform">`
- `.sec-head`: "**02**" + `sec2_h2` / `sec2_sub`.
- `.showcase`: `grid-template-columns:340px 1fr; gap:38px` (→ 1col ≤1000px).
- **Left** `.sc-tabs[data-stagger]` (flex column): 3 `<button class="sc-tab">`, each `.bar` (animated left accent), `.tn` mono label, `h4[data-i18n]`, `p[data-i18n]`:
  - Tab A: tn "A · Automation" / `sc1_h4` / `sc1_p`
  - Tab B: tn "B · Internal tools" / `sc2_h4` / `sc2_p`
  - Tab C: tn "C · Custom systems" / `sc3_h4` / `sc3_p`
- **Right** `.sc-stage` (min-height 440px, `--bg-2`, soft shadow): `.sc-topbar` (3 `.sc-dot` + `.sc-url` "app.wrenfieldworks.com / live"); three `.sc-panel` (display:none, `.show` reveals one):
  - **Panel A (automation):** three `.mock-row` (icon + name + mono sub + pill): "Inbox → structured data / runs every 5 min · 1,204 today / **Healthy**", "Nightly reporting export / last run 02:00 · 38 reports / **Healthy**", "CRM ↔ accounting sync / bi-directional · 0 conflicts / **Running**". Then `.mock-grid` 3 KPIs: `~10h`/Saved / week, `99.9%`/Uptime, `0`/Manual touches.
  - **Panel B (dashboard):** `.mock-grid` 3 KPIs: `฿2.4M`/Pipeline value, `182`/Active accounts, `+24%`/QoQ growth. `.mock-chart` of 8 `.mock-bar` (`data-h` = 42/58/50/74/66/88/78/100%). One `.mock-row`: "Top performer · Q3 / Siriphan Group · 38 deals / **On target**".
  - **Panel C (deploy/code):** `.code-line` block — `# deploy — idea to production`, `$ wf ship "client-portal" --env prod`, `✓ tests passed · 142/142`, `✓ migrations applied`, `✓ handover docs generated`, `→ live in 38s`. Then `.mock-row`: "Shipped & handed over clean / owned by your team, documented / **Deployed**".
- Bars animate from 0→`data-h` on tab select; first tab auto-selected on load.

### 3.7 SELECTED WORK / CASE STUDIES — `<section class="blk" id="work">`
- `.sec-head`: "**03**" + `sec3_h2` / `sec3_sub`.
- `.case-grid[data-stagger]`: `grid-template-columns:repeat(3,1fr); gap:18px` (→ 1col ≤820px).
- 3 `.case` cards, each: `.thumb` (150px, `<canvas>` lattice + `.glyph` serif italic letter), `.body` with `.tag` (mono), `h4[data-i18n]`, `p[data-i18n]`, `.stat` line. Hover lift `-4px`.
  - Case 1: glyph "C", tag "CRM · Platform", `case1_h4`/`case1_p`, stat `<b>−40%</b> review cycles · <b>182</b> accounts live`
  - Case 2: glyph "A", tag "Automation · Pipeline", `case2_h4`/`case2_p`, stat `<b>~10h</b> saved / week · <b>99.9%</b> uptime`
  - Case 3: glyph "T", tag "Tooling · Assistant", `case3_h4`/`case3_p`, stat `<b>½</b> onboarding time · <b>1-click</b> answers`

### 3.8 PROCESS (sticky pinned) — `<section class="blk" id="process">`
- `.sec-head`: "**04**" + `sec4_h2` / `sec4_sub`.
- `.process-wrap`: `grid-template-columns:0.85fr 1.15fr; gap:60px; align-items:start` (→ 1col ≤1000px; sticky becomes static).
- **Left** `.process-sticky` (`position:sticky; top:120px`): `.big-n` huge serif italic number, `<h3>` step title, `.pth` Thai sub. These are **updated by JS** as you scroll (language-aware).
- **Right** `.process-steps` (flex column, gap 18px): 3 `.pstep` cards, each with `data-n / data-t / data-th`, a `.pn` row showing both `NN — Title` and the Thai word, `h4[data-i18n]`, `p[data-i18n]`, and a `.det` checklist (3 `✓` lines, English-only literals):
  - Step 1 `.on` initially: `data-n="01" data-t="Scope" data-th="กำหนดขอบเขต"`; pn `01 — Scope` / `กำหนดขอบเขต`; `p1_h4`/`p1_p`; det "Problem & constraints mapped / Concrete definition of done / Fixed scope, no surprises".
  - Step 2: `data-n="02" data-t="Build" data-th="ลงมือสร้าง"`; `p2_h4`/`p2_p`; det "Weekly working builds / Quality before speed / You stay in the loop".
  - Step 3: `data-n="03" data-t="Deploy" data-th="ส่งมอบ"`; `p3_h4`/`p3_p`; det "Production deploy + monitoring / Clean handover & docs / Built to survive real users".

### 3.9 TESTIMONIAL — `<section class="blk" id="words">`
- `.wrap-tight` → `.quote-blk.reveal` (`max-width:900px; text-align:center`): mark `.mk` (48×48, `color:var(--accent)`, opacity .7); `<blockquote data-i18n="quote">`; `.by[data-i18n="quote_by"]` attribution.

### 3.10 CTA / CONTACT — `<section class="blk cta-sec" id="contact">`
- `<canvas id="cta-canvas">` lattice (`opacity:calc(.5*var(--tx-lattice))`, radial mask `60% 80% at 50% 50%`). Section `text-align:center`.
- `.wrap` (z 3): `.kicker.reveal` "Let's build · มาสร้างกัน" (**bilingual literal, no data-i18n**); `<h2 data-i18n="cta_h2">`; `<p data-i18n="cta_p">`; `.cta.reveal` (`.btn.solid` → `mailto:hello@wrenfieldworks.com` label "hello@wrenfieldworks.com →" **static literal**, `.btn` → `#` `data-i18n="cta_book"`); `.links.reveal` 3 `.ghost` (LinkedIn / GitHub / X / Twitter — **static literals**).

### 3.11 FOOTER — `<footer>`
- `padding:64px 0 48px`, top hairline.
- `.foot-top`: `grid-template-columns:1.7fr 1fr 1fr; gap:40px` (→ `1fr 1fr` ≤820px → `1fr` ≤520px); bottom hairline.
  - `.foot-brand`: `.bn` (mark 26×26 + "Wrenfield **Works**"); `p[data-i18n="foot_p"]`.
  - `.foot-col` 1: `h5[data-i18n="foot_studio"]` + 4 links reusing `nav_*` keys (Capabilities/Platform/Work/Process).
  - `.foot-col` 2: `h5[data-i18n="foot_connect"]` + Email/LinkedIn/GitHub/X / Twitter (**static literals**).
- `.foot-bot` (mono, uppercase, `.12em`): "AI-assisted systems, built right." + "© 2026 Wrenfield Works · แม่นยำ · ไม่โอ้อวด · มีรสนิยม" (**static bilingual literal**).

### 3.12 Scripts (end of body)
`enterprise.js` then `i18n.js`, then (panel-only, **do NOT port**) React 18.3.1 UMD + Babel standalone + `tweaks-panel.jsx` / `tweaks-app.jsx`. The tweaks are an authoring-time control panel, not part of the shipped site.

---

## 4. Interactions & animation (`enterprise.js`)

Wrapped in one IIFE, `'use strict'`. Globals: `reduce = matchMedia('(prefers-reduced-motion: reduce)').matches`; `isTouch = matchMedia('(max-width:900px)').matches`; `motionOff()` = `body.classList.contains('motion-off')`; `BRASS='#CBA265'`.

> **Reduced-motion note (flag):** `reduce` is computed but the engine actually gates animation on
> the **`body.motion-off` class** (`motionOff()`), not on `prefers-reduced-motion`. In the prototype
> the tweaks panel toggles `motion-off`; `prefers-reduced-motion` is honored only via CSS rules
> (`body.motion-off .reveal/.draw/.hero h1 .w-in` reset). **For the CMS reimplementation, wire
> `motion-off` to `prefers-reduced-motion: reduce` so OS settings are respected.**

1. **Nav scroll state:** `scroll` listener (passive) toggles `nav.scrolled` when `scrollY > 24`.
2. **Custom cursor** (skip if `isTouch`): `.cursor-dot` follows pointer instantly; `.cursor-ring` lerps toward pointer at factor `.16` per rAF. Hovering `a,button,.sc-tab,.logo-item,.cap,.case` adds `.hot` (ring grows 34→54px, tints). Hidden ≤900px via CSS.
3. **Magnetic buttons** (skip if `isTouch`): `[data-magnetic]` translate toward cursor by `x*.28, y*.34` of offset-from-center; reset on `mouseleave`; no-op when `motionOff()`.
4. **Scroll reveal:** `IntersectionObserver` `{threshold:.16, rootMargin:'0px 0px -8% 0px'}` adds `.in` and unobserves. Stagger: within a `[data-stagger]` group each `.reveal` gets `transitionDelay = index*70ms`. **Fallback `kickReveal()`** manually reveals anything with `top < vh*0.92 && bottom > 0` on `load`, `resize`, and at `setTimeout` `[120,400,900]ms` (guards against IO mis-firing in embedded viewports).
5. **Hairline dividers:** separate IO `{threshold:0, rootMargin:'0px 0px -12% 0px'}` adds `.rule-in` to `section.blk:not(.no-rule)` → `::before` `scaleX(0→1)` over 1.15s. Fallback `kickRule()` at `top < vh*0.88`, on load/resize and `[160,500,1000]ms`.
6. **Animated counters:** IO `{threshold:.6}`. Per `[data-count]`: `to=parseFloat(data-count)`, `dec=parseInt(data-dec||'0')`, `dur=1400ms`. Formatter `fmt`: if `dec` → `n.toFixed(dec)`, else `Math.round(n).toLocaleString()`. Easing = cubic ease-out `1-(1-p)^3`. Writes to `el.firstChild.textContent` (so the `.u` unit span is preserved). If `motionOff()` → set final value instantly.
7. **Showcase tabs:** `selTab(i)` toggles `.active` on tab `i` and `.show` on panel `i`; resets that panel's `.mock-bar` heights to 0 then to `data-h` over two rAFs (CSS transitions height .6s). Click handlers per tab; `selTab(0)` on init.
8. **Process sticky highlight (language-aware):** IO `{threshold:.55}` — when a `.pstep` is intersecting with `intersectionRatio > .5`, clear `.on` from all, add to current, and `setSticky()`: sets `.big-n` = `data-n`, primary line (`h3`) = current language (`data-th` if `window.__lang==='th'` else `data-t`), sub line (`.pth`) = the **other** language (always bilingual). Re-runs on language switch via `window.__wf.refreshProcess()`.
9. **Generative lattice canvas** `latticeField(canvas, opts)` — the live brand motif. Defaults `{density:90, linkDist:150, speed:.18, mouse:true, react:120, pulses:false, maxPulses:6}`.
   - `size()`: `DPR=min(2, devicePixelRatio)`; node `count = round(W*H / density²)`; each node `{x,y rand; vx,vy=(rand-.5)*speed; r=rand*1.4+1.1; ring = rand<.14}` (~14% are hollow rings).
   - `frame()`: clear; `slow = motionOff()?0:1`; drift each node by `vx*slow`/`vy*slow`, wrap at ±20px past edges; mouse repulsion within `react` px: push by `(react-d)/react*.8` along the normal. **Links:** for every node pair within `linkDist`, stroke `rgba(181,137,74,(1-d/linkDist)*.32)` 1px. **Nodes:** rings → stroke `rgba(203,162,101,.7)` 1.3px at `r+2.4`; solids → fill `rgba(203,162,101,.85)` at `r`. **Pulses** (if `opts.pulses`): up to `maxPulses`, spawn prob `.05`/frame from a random node to its nearest linked neighbor; travel `t += sp` (`sp=.012+rand*.014`); render a soft halo (`r 5.5`, `rgba(203,162,101,.10*sin(tπ))`) + bright core (`r 2.1`, `rgba(232,205,150,.95*sin(tπ))`); remove at `t>=1`.
   - Mouse tracked relative to canvas rect (if `opts.mouse`). `resize` re-sizes + restarts. An IO `{threshold:0}` **pauses** the rAF loop when the canvas is offscreen (perf).
   - Instances: **hero** `{density:78, linkDist:165, speed:.2, react:140, pulses:true, maxPulses:7}`; **CTA** `{density:96, linkDist:140, speed:.14, react:90, pulses:true, maxPulses:4}`; **each case thumb** `{density:62, linkDist:96, speed:.1, mouse:false, react:0}` (static-ish, no mouse).
10. **Hero headline word reveal** `wrapHeroH1()`: deep-walks `.hero h1`, splitting text nodes on whitespace into `<span class="word"><span class="w-in">token</span></span>`, preserving inline `<em>`/`<b>` and whitespace; each `.w-in` gets `transitionDelay = index*52ms`. Then removes `.in`, and re-adds it over two rAFs **and** a 260ms timeout (belt-and-braces) → CSS animates `translateY(.5em)+opacity 0 → 0/1` over .8s. Re-invoked on language change.
11. **`window.__wf` API** (for the tweaks app + i18n): `replayDraw()` (restart `.draw` SVG stroke animations by class re-add), `wrapHeroH1`, `refreshProcess()`. If `i18n.js` hasn't set `window.__lang` yet, `wrapHeroH1()` is called once so the headline still animates.
12. **Hero parallax:** if `.hero-glow` and not touch, `scroll` (passive) sets `translateY(scrollY*.12)`, skipped when `motionOff()`.
13. **CSS-only animations** (not JS): `.draw` SVG stroke-dashoffset draw-on (1.4s, staggered circle fade-ins at .9/1.05/1.2/1.35/1.5s); `.scroll-hint .ln` `scrolldn` 2.2s infinite; marquee `marq` 38s linear infinite; `.sc-panel.show` `panelin` .5s; hairline `::before` scaleX; reveal/word transitions.

### 4.1 Language toggle logic (`i18n.js`)

- **Dictionary `DICT`** keyed by `data-i18n` name; each value `{en, th}` (values may contain inline HTML like `<em>`, `<b>`, `<span class="arr">`).
- **`getLang()`**: `localStorage.getItem('wf-lang') || 'en'` (try/catch → `'en'`). **Default language = `en`.** **No browser-language / `navigator.language` auto-detection** — persistence only.
- **`applyLang(lang)`**: normalizes to `'th'|'en'`; sets `window.__lang`, `document.documentElement.lang`, toggles `body.lang-th`; for every `[data-i18n]` sets `el.innerHTML = DICT[key][lang]`; toggles `.on` on the matching `.lang-tog [data-lang]` button; persists to `localStorage('wf-lang')`; then calls `window.__wf.wrapHeroH1()` + `refreshProcess()` to re-animate/re-localize the headline and sticky.
- Exposed as `window.__applyLang`. Applied immediately on load with the saved language. Pills wired via click → `applyLang(data-lang)`.
- **No theme toggle exists in JS** (only `body.paper` is defined in CSS; nothing toggles it). The `motion-off` class is also only toggled by the (non-shipped) tweaks panel.

---

## 5. Responsive breakpoints (all `@media` in `enterprise.css`)

| Breakpoint | What changes |
|---|---|
| `max-width:900px` (body) | `body{cursor:auto}` (re-enable native cursor) |
| `max-width:900px` (cursor) | `.cursor-dot,.cursor-ring{display:none}` |
| `max-width:1080px` (nav) | `.nav-links{gap:24px}`; `.lang-tog{display:none}` |
| `max-width:920px` (nav) | `.nav-links .lk{display:none}` (hide section links) |
| `max-width:900px` (nav) | `.nav-links .lk,.lang-tog{display:none}` (both hidden → brand + CTA only) |
| `max-width:820px` OR `max-height:760px` | `.scroll-hint{display:none}` |
| `max-width:1000px` | `.showcase{grid-template-columns:1fr}`; `.process-wrap{grid-template-columns:1fr; gap:36px}`; `.process-sticky{position:static}`; `.process-sticky .big-n{font-size:96px}` |
| `max-width:820px` | `.wrap,.wrap-tight{padding:0 24px}`; `.stats{grid-template-columns:repeat(2,1fr)}`; `.stat-cell:nth-child(2){border-right:none}`; `.stat-cell:nth-child(1),:nth-child(2){border-bottom:1px solid var(--line)}`; `.cap-grid,.case-grid{grid-template-columns:1fr}`; `.foot-top{grid-template-columns:1fr 1fr}`; `section.blk{padding:76px 0}` |
| `max-width:520px` | `.foot-top{grid-template-columns:1fr}` |

(There is no explicit `520`-only nav rule, and no `≥` min-width queries; the design is desktop-first with the above max-width steps.)

---

## 6. COMPLETE bilingual content inventory (verbatim seed data)

> Copied character-for-character from `i18n.js` `DICT`. HTML entities (`&amp;`), inline tags
> (`<em>`, `<b>`, `<span class="arr">→</span>`), em-dashes (`—`), middots (`·`), Thai text, and
> punctuation are preserved exactly. **38 keys**, each with both `en` and `th`.
>
> **Default language: `en`.** Detection/persistence: `localStorage['wf-lang']` (fallback `en`);
> no browser-locale sniffing; selection persists across visits; `<html lang>` and `body.lang-th`
> are set on apply.

### nav.*
| key | en | th |
|---|---|---|
| `nav_cap` | `Capabilities` | `บริการ` |
| `nav_platform` | `Platform` | `แพลตฟอร์ม` |
| `nav_work` | `Work` | `ผลงาน` |
| `nav_process` | `Process` | `กระบวนการ` |
| `nav_cta` | `Get in touch <span class="arr">→</span>` | `ติดต่อเรา <span class="arr">→</span>` |

### hero.*
| key | en | th |
|---|---|---|
| `hero_h1` | `Production systems for teams that <em>can't afford to break.</em>` | `ระบบ production สำหรับทีมที่ <em>ผิดพลาดไม่ได้</em>` |
| `hero_sub` | `We design, build, and ship the automation, internal tools, and workflow platforms that run real businesses — <b>from idea to deployed, end to end.</b>` | `เราออกแบบ สร้าง และส่งมอบระบบอัตโนมัติ เครื่องมือภายใน และแพลตฟอร์มเวิร์กโฟลว์ที่ขับเคลื่อนธุรกิจจริง — <b>ตั้งแต่ไอเดียจนถึงการ deploy ครบวงจร</b>` |
| `hero_trust` | `Trusted across CRM · automation · internal tooling · data platforms` | `ไว้วางใจในงาน CRM · ระบบอัตโนมัติ · เครื่องมือภายใน · แพลตฟอร์มข้อมูล` |

### stats.*
| key | en | th |
|---|---|---|
| `stat1_k` | `Systems shipped to production` | `ระบบที่ส่งขึ้น production` |
| `stat2_k` | `Average review cycles cut` | `ลดรอบรีวิวโดยเฉลี่ย` |
| `stat3_k` | `Ship velocity vs. team size` | `ความเร็วการส่งงานเทียบขนาดทีม` |
| `stat4_k` | `Direct line to the builder` | `คุยกับคนสร้างโดยตรง` |

(Numeric values + units are NOT in DICT — they are HTML: counts `60 / 40 / 10 / 100`, units `+ / % / × / %`. See §7.)

### sections (headings).*
| key | en | th |
|---|---|---|
| `sec1_h2` | `What we build` | `สิ่งที่เราสร้าง` |
| `sec1_sub` | `Systems designed around how your team actually works` | `ระบบที่ออกแบบรอบวิธีทำงานจริงของทีมคุณ` |
| `sec2_h2` | `One practice, three surfaces` | `หนึ่งทีม สามด้านงาน` |
| `sec2_sub` | `Switch between them — tap to see a real example` | `เลือกดูแต่ละด้าน — กดสลับเพื่อดูตัวอย่างจริง` |
| `sec3_h2` | `Selected work` | `ผลงานที่คัดมา` |
| `sec3_sub` | `Each started as a rough idea and became something a team uses daily` | `ทุกชิ้นเริ่มจากไอเดียคร่าว ๆ จนเป็นระบบที่ทีมใช้ทุกวัน` |
| `sec4_h2` | `How we work` | `วิธีการทำงาน` |
| `sec4_sub` | `Clear, transparent, handed over clean` | `ชัดเจน โปร่งใส ส่งมอบสะอาด` |

### capabilities.*
| key | en | th |
|---|---|---|
| `cap1_h3` | `Automation &amp; workflows` | `ระบบอัตโนมัติ &amp; เวิร์กโฟลว์` |
| `cap1_p` | `Pipelines and integrations that remove manual, repetitive work — data flows, reporting, and the glue between the tools a team already runs on.` | `ไปป์ไลน์และการเชื่อมต่อที่ขจัดงานซ้ำ ๆ ที่ต้องทำมือ — การไหลของข้อมูล รายงาน และตัวเชื่อมระหว่างเครื่องมือที่ทีมใช้อยู่แล้ว` |
| `cap2_h3` | `Internal tools &amp; dashboards` | `เครื่องมือภายใน &amp; แดชบอร์ด` |
| `cap2_p` | `Admin panels and operational tools built around how a team actually works — not generic templates bent to fit. Every control where it belongs.` | `แผงควบคุมและเครื่องมือปฏิบัติการที่สร้างรอบวิธีทำงานจริงของทีม — ไม่ใช่เทมเพลตสำเร็จรูปที่ดัดให้พอใช้ ทุกการควบคุมอยู่ตรงที่ควรอยู่` |
| `cap3_h3` | `Custom platforms` | `แพลตฟอร์มเฉพาะทาง` |
| `cap3_p` | `CRMs, booking systems, client portals, and data tools — designed, built, and deployed end to end, hardened for real users from day one.` | `CRM ระบบจอง พอร์ทัลลูกค้า และเครื่องมือข้อมูล — ออกแบบ สร้าง และ deploy ครบวงจร แข็งแรงพร้อมผู้ใช้จริงตั้งแต่วันแรก` |
| `cap4_h3` | `AI-assisted delivery` | `ส่งมอบด้วยพลัง AI` |
| `cap4_p` | `AI does the heavy lifting; human judgment does the rest. The result is a small operation that ships at the pace of a team ten times its size.` | `AI รับงานหนัก ส่วนวิจารณญาณคนทำที่เหลือ ผลคือทีมเล็กที่ส่งงานได้เร็วเท่าทีมที่ใหญ่กว่าสิบเท่า` |

### showcase.* (platform tabs)
| key | en | th |
|---|---|---|
| `sc1_h4` | `Hands-off pipelines` | `ไปป์ไลน์ที่ไม่ต้องแตะ` |
| `sc1_p` | `Email-to-data, reporting, sync` | `อีเมลเป็นข้อมูล รายงาน ซิงก์` |
| `sc2_h4` | `Operational dashboards` | `แดชบอร์ดปฏิบัติการ` |
| `sc2_p` | `The right answer, one click away` | `คำตอบที่ใช่ ห่างแค่คลิกเดียว` |
| `sc3_h4` | `Deployed &amp; hardened` | `Deploy แล้ว แข็งแรงพร้อมใช้` |
| `sc3_p` | `Shipped clean, built to last` | `ส่งมอบสะอาด สร้างให้อยู่ทน` |

### work.* (case studies)
| key | en | th |
|---|---|---|
| `case1_h4` | `Enterprise CRM &amp; portal` | `CRM &amp; พอร์ทัลระดับองค์กร` |
| `case1_p` | `End-to-end CRM with client portal and automated workflows, built for a team that had outgrown spreadsheets.` | `CRM ครบวงจรพร้อมพอร์ทัลลูกค้าและเวิร์กโฟลว์อัตโนมัติ สร้างให้ทีมที่โตเกินกว่าจะใช้สเปรดชีต` |
| `case2_h4` | `Ops automation suite` | `ชุดระบบอัตโนมัติงานปฏิบัติการ` |
| `case2_p` | `Email-to-data pipelines and reporting bots that turned hours of manual processing into a hands-off routine.` | `ไปป์ไลน์แปลงอีเมลเป็นข้อมูลและบอทรายงาน ที่เปลี่ยนงานมือหลายชั่วโมงให้เป็นงานอัตโนมัติ` |
| `case3_h4` | `Internal tooling layer` | `เลเยอร์เครื่องมือภายใน` |
| `case3_p` | `Estimate calculators, internal chatbots, and dashboards that put the right answer one click away for the whole team.` | `เครื่องคิดราคา แชทบอทภายใน และแดชบอร์ด ที่ทำให้คำตอบที่ใช่อยู่ห่างทั้งทีมแค่คลิกเดียว` |

### process.*
| key | en | th |
|---|---|---|
| `p1_h4` | `Define what "shipped" means` | `นิยามว่า "เสร็จ" คืออะไร` |
| `p1_p` | `Understand the real problem and the constraints before a line of code. We agree on exactly what success looks like — measurable, dated, and owned.` | `เข้าใจปัญหาจริงและข้อจำกัดก่อนเขียนโค้ดสักบรรทัด เราตกลงกันชัดว่าความสำเร็จหน้าตาเป็นอย่างไร — วัดได้ มีกำหนด และมีเจ้าของ` |
| `p2_h4` | `AI-leveraged, production-grade` | `ใช้ AI เป็นพลัง ระดับ production` |
| `p2_p` | `Fast iterations with you in the loop throughout. AI carries the volume; judgment carries the quality. You see progress in days, not quarters.` | `ทำซ้ำเร็วโดยมีคุณอยู่ในลูปตลอด AI รับปริมาณงาน วิจารณญาณคุมคุณภาพ คุณเห็นความคืบหน้าเป็นวัน ไม่ใช่ไตรมาส` |
| `p3_h4` | `Ship it, hand it over clean` | `ส่ง deploy แล้วส่งมอบสะอาด` |
| `p3_p` | `Deploy to production, document it, and build it to last past the first real users. Your team owns the system — no lock-in, no mystery.` | `Deploy ขึ้น production ทำเอกสาร และสร้างให้อยู่ทนเกินกว่าผู้ใช้จริงกลุ่มแรก ทีมคุณเป็นเจ้าของระบบ — ไม่ผูกขาด ไม่มีอะไรลึกลับ` |

> **Process step labels** (not in DICT — they live in HTML `data-t`/`data-th` attributes, consumed by the sticky JS):
> Step 01: `data-t="Scope"` / `data-th="กำหนดขอบเขต"` · Step 02: `data-t="Build"` / `data-th="ลงมือสร้าง"` · Step 03: `data-t="Deploy"` / `data-th="ส่งมอบ"`.
> The `.det` checklist lines (e.g. "Problem & constraints mapped") are **English-only HTML literals**, not translated.

### testimonial.*
| key | en | th |
|---|---|---|
| `quote` | `"We talked to the person actually doing the work. It shipped in <em>weeks</em>, survived our busiest quarter, and the handover was so clean our own team owns it now."` | `"เราได้คุยกับคนที่ลงมือทำจริง มันส่งมอบใน <em>ไม่กี่สัปดาห์</em> รอดผ่านไตรมาสที่ยุ่งที่สุดของเรา และการส่งมอบสะอาดจนทีมเราเป็นเจ้าของเองได้เลย"` |
| `quote_by` | `— Operations Director · <b>Meridian Freight</b>` | `— ผู้อำนวยการฝ่ายปฏิบัติการ · <b>Meridian Freight</b>` |

### cta.*
| key | en | th |
|---|---|---|
| `cta_h2` | `Have something <em>worth building?</em>` | `มีอะไรที่ <em>ควรค่าแก่การสร้าง?</em>` |
| `cta_p` | `Tell us what you're trying to ship. If it's a system, a tool, or an automation — it's probably in scope.` | `บอกเราว่าคุณกำลังจะส่งอะไร — ถ้าเป็นระบบ เครื่องมือ หรือ automation มันมักจะอยู่ในขอบเขตของเรา` |
| `cta_book` | `Book a call` | `นัดคุย` |

### footer.*
| key | en | th |
|---|---|---|
| `foot_p` | `AI-assisted systems, built right. The independent practice that ships like a team ten times its size.` | `ระบบที่ใช้ AI สร้าง ทำมาอย่างถูกต้อง ทีมอิสระที่ส่งงานได้เหมือนทีมที่ใหญ่กว่าสิบเท่า` |
| `foot_studio` | `Studio` | `สตูดิโอ` |
| `foot_connect` | `Connect` | `ติดต่อ` |

**Key count: 38 keys × 2 languages = 76 strings.** (5 nav + 3 hero + 4 stats + 8 section + 8 cap + 6 showcase + 6 work + 6 process + 2 testimonial + 3 cta + 3 footer = 38.)

### 6.1 Bilingual literals that are NOT in DICT (hard-coded both-languages in HTML)
These appear in **both languages simultaneously** in the markup (not toggled). They must still be
captured as bilingual seed content in the CMS:
- Marquee head: `Systems shipped for teams across industries · ระบบที่ส่งมอบให้ทีมในหลากหลายอุตสาหกรรม`
- CTA kicker: `Let's build · มาสร้างกัน`
- Footer bottom-right: `© 2026 Wrenfield Works · แม่นยำ · ไม่โอ้อวด · มีรสนิยม`
- Process card `.pn` rows render both `NN — Title` (EN) and the Thai word side by side.

### 6.2 EN-only strings shown in the design but missing from DICT (need TH added for CMS — FR-014)
These render as static English in the prototype and have **no Thai counterpart yet**. Per the
constitution's i18n rule, the CMS must supply Thai before publish:
- Hero kicker: `AI-assisted systems, built right.`
- Hero CTA buttons: `See selected work`, `Start a project`
- CTA email button: `hello@wrenfieldworks.com` (likely stays as-is) + `Book a call` (this one IS in DICT as `cta_book`)
- CTA links + footer Connect links: `LinkedIn`, `GitHub`, `X / Twitter`, `Email`
- Footer bottom-left: `AI-assisted systems, built right.`
- Showcase mock-UI copy (panels A/B/C): all row names, KPI labels, code lines, pills (e.g. "Inbox → structured data", "Saved / week", "Pipeline value", "deploy — idea to production", etc.) — these are decorative product-mock content; treat as a content decision (likely English mono by design).
- Capability `.meta` Thai+English mixed tags and case `.tag`/`.stat` literals (see §7).

---

## 7. Intentionally English-only / mono labels (the "voice of systems")

`i18n.js` header states mono/technical labels (kickers, tags, section numbers) **stay English by
design**. These are NOT translated and should be reproduced as English mono literals (some carry a
single Thai word as flavor, noted below).

**Section numbers (mono, `--accent-deep`):** `01` (Capabilities), `02` (Platform), `03` (Work),
`04` (Process). Also the process `.big-n` / step `data-n` `01 / 02 / 03`.

**Capability category tags (`.cn`, mono uppercase):** `Automation`, `Tools`, `Systems`, `Leverage`.

**Capability `.meta` tag rows (mono; one Thai word + English tags each):**
- `ระบบอัตโนมัติ` · `Integrations` · `Reporting bots`
- `เครื่องมือภายใน` · `Dashboards` · `Admin`
- `ระบบเฉพาะทาง` · `CRM` · `Portals`
- `ใช้ AI เป็นเลเวอเรจ` · `Quality first`

**Showcase tab labels (`.tn`, mono):** `A · Automation`, `B · Internal tools`, `C · Custom systems`.

**Showcase stage URL:** `app.wrenfieldworks.com / live`.

**Showcase mock-UI literals (panels — English mono product chrome):** row names ("Inbox →
structured data", "Nightly reporting export", "CRM ↔ accounting sync", "Top performer · Q3",
"Shipped & handed over clean"), subs ("runs every 5 min · 1,204 today", "last run 02:00 · 38
reports", "bi-directional · 0 conflicts", "Siriphan Group · 38 deals", "owned by your team,
documented"), KPI labels ("Saved / week", "Uptime", "Manual touches", "Pipeline value", "Active
accounts", "QoQ growth"), code lines (`# deploy — idea to production`, `$ wf ship "client-portal"
--env prod`, `✓ tests passed · 142/142`, `✓ migrations applied`, `✓ handover docs generated`, `→
live in 38s`).

**Status pills (`.pill`, mono uppercase):** `Healthy`, `Running`, `On target`, `Deployed`.

**KPI values / units (serif numerals, mono units — not in DICT):**
- Stats strip counts/units: `60+`, `40%`, `10×`, `100%`
- Mock KPIs: `~10h`, `99.9%`, `0`, `฿2.4M`, `182`, `+24%`
- Case stats: `−40%`, `182`, `~10h`, `99.9%`, `½`, `1-click`
- Currency symbol `฿`, math/operator symbols `% × + − ↔ →`, the `®` and `®`-style `.tm`.

**Case study tags (`.tag`, mono):** `CRM · Platform`, `Automation · Pipeline`, `Tooling · Assistant`.

**Case glyphs (decorative serif letters):** `C`, `A`, `T`.

**Process `.det` checklist (English-only literals):** "Problem & constraints mapped", "Concrete
definition of done", "Fixed scope, no surprises", "Weekly working builds", "Quality before speed",
"You stay in the loop", "Production deploy + monitoring", "Clean handover & docs", "Built to
survive real users".

**Brand / client names (never translated):** `Wrenfield Works` (wordmark "Works" in accent);
marquee logos `Northbound®`, `Siriphan Group`, `Halcyon Labs`, `Meridian Freight`, `Kasem & Co.`,
`Atlas Retail`, `Verdant Health`, `Rung Capital`; testimonial client `Meridian Freight` (stays
English even in TH `quote_by`); dashboard mock client `Siriphan Group`.

**Email / URL / social literals:** `hello@wrenfieldworks.com`, `app.wrenfieldworks.com / live`,
`LinkedIn`, `GitHub`, `X / Twitter`, `Email`.

> Note: the brief's example client names (Northwind/Lumen/Apsis/Vault) do **not** appear in this
> prototype; the actual marquee/client names are the eight listed above + Siriphan Group.

---

## Ambiguities & gaps to flag for reimplementation

1. **Paper/light theme has no toggle.** `body.paper` is fully defined in CSS (12 vars) but **no JS
   adds/removes the class** and there is no UI control in the HTML. The constitution requires a
   "persistent visitor theme toggle" with AA contrast in both themes — the toggle must be **built
   new**; the prototype only provides the color override values (which are partial — see #2).
2. **Paper theme is partial.** It re-points 12 semantic variables but many brass/mint colors are
   hard-coded literals (lattice canvas, `#86B88A` pills/strings/trust dot, cursor ring, hero glow,
   card-hover radial). Those will **not** adapt to paper theme and must be tokenized for AA contrast
   in light mode.
3. **Token names differ from the brief.** No `--ink-soft/--paper-dim/--brass-bright/--muted/
   --muted-soft/--r/--maxw/--pad/--th-*` exist; use the mapping table in §1. `.wrap` max-width
   (1180) and padding (48px) are hard-coded, not tokenized.
4. **`--positive` is referenced but never defined** (only the `#86B88A` fallback is used).
5. **No `:lang(th)` selectors** — Thai styling relies entirely on `body.lang-th` + font fallbacks.
6. **Reduced-motion is gated on `body.motion-off`, not `prefers-reduced-motion`** in JS (only CSS
   resets honor the media query). Wire `motion-off` to the OS setting in the rebuild.
7. **Several visible strings lack Thai** (hero kicker, hero CTA buttons, social/footer links, mock
   UI) — must add TH in the CMS to satisfy FR-014 (both EN+TH required before publish).
8. **`lockup-on-dark.svg` is unused** by the HTML (which inlines the `#mark` symbol + text); decide
   whether the CMS uses the full lockup asset or the inline mark + wordmark.
9. **Default language is `en` with no locale auto-detection** — the Next.js `proxy.ts` routing will
   need its own EN/TH detection policy (the prototype only persists a manual choice in localStorage).
10. **Tweaks files (`tweaks-*.jsx`) are authoring-only** (React+Babel CDN) and out of scope — do
    not port. They drive `--tx-grain`, `--tx-lattice`, `motion-off`, and theme experimentation.
