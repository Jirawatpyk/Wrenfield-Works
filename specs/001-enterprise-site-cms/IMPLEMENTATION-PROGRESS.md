# Implementation Progress & Execution Plan

> Working log for `/speckit-implement` of feature **001-enterprise-site-cms**.
> Keep this updated as phases complete. Survives context compaction — read this first on resume.

**Mode**: ultracode (xhigh + multi-agent workflow), checkpoints per phase (user-approved 2026-05-31).
**Output style**: explanatory.

## Environment (verified 2026-05-31)
- Node v20.19.5 (≥20.9 ✓ for Next 16), pnpm 10.17.1, npm 11.6.1, Docker 29.2.0, git 2.52, corepack 0.33.
- OS Windows 11, PowerShell. Repo: `C:\Users\Jiraw\OneDrive\Documents\Wrenfield Works`. Branch `001-enterprise-site-cms`.

## >>> RESUME HERE (start of a fresh session) <<<
### ✅ PHASE 3 (US1, T021–T045) COMPLETE & VERIFIED (2026-05-31, session 3).
**Final verify:** tsc=0, `pnpm build`=0 (/en /th prerendered static from seeded DB), `pnpm vitest run`=0
(content unit 26/26), `pnpm test:e2e`=0 (**18/18 Playwright green**: sections, i18n+bare-path persistence,
theme persist, axe WCAG AA on EN-dark/EN-paper/TH-dark, reduced-motion+pausable marquee, responsive
360–1440, mono-labels). Tasks T021–T045 marked [X] in tasks.md. **NEXT: Phase 4 = US2 CMS (T046–T063).**

**Design-fidelity pass vs `docs/Frist Pilot-handoff` — TWO rounds, all verified (final: tsc=0, build=0,
vitest=0, e2e 18/18, + a `visaudit` Playwright probe showing every section opacity:1 in EN & TH).**

Round 1 (font/visibility basics): (1) Hero/CTA used STATIC `className="reveal"` → switched to `<Reveal>`.
(2) Element-level type scale (h1/h2/h3/.lead/p/.kicker/.label/.num/.sub-th + ::selection) was dropped in the
CSS port → re-added to `globals.css` verbatim from enterprise.css (fidelity probe: 0 typography diffs).
(3) Hero `.hero-mk`+`.scroll-hint` markup added. (4) layout.tsx: theme boot script via
`<Script strategy="beforeInteractive">` INSIDE `<body>` (raw `<script>` in `<head>` throws — document.body
null there; the empirical fix that passed the theme-persist e2e), + `data-scroll-behavior="smooth"` (Next 16).
(5) Harness: `playwright.config` workers=1 + timeout 60s (lattice canvases are CPU-heavy → parallel workers
timed out); a11y/responsive use `page.emulateMedia({reducedMotion:'reduce'})`. AA tokens: dark `--fg3`
#6e747c→#8e949c; paper accent→bronze #7a5e2a/#6f5325, `--on-accent`#fff, nav-bg opacity↑, paper logo opacity .8.

Round 2 (user: "เส้น section ไม่ครบ / หัว+คำอธิบายติดกัน / chart ไม่ interactive / ของหาย"): diagnosed with a
NORMAL-motion `visaudit` probe (opacity per section) + a 22-agent parity workflow (component vs prototype HTML).
Confirmed + fixed:
- **Reveal v3** — was IntersectionObserver-only; under lattice-canvas CPU load the callback was dropped →
  9 containers stuck opacity:0 ("ของหาย"). Now IO + a HARD 1s timeout that reveals regardless (content can
  never stay hidden). Same robust pattern in new **`SectionRules.tsx`** which adds `.rule-in` to draw the
  per-section hairlines (prototype's enterprise.js did this; not ported → "เส้นไม่ครบ").
- **`.ht` wrapper** added in Process + Showcase `.sec-head` (was missing → number/h2/sub laid out as flex row
  on one line = "หัว+คำอธิบายติดกัน").
- **Showcase chart** — `<Chart>` now grows bars 0→height on tab-activate via 2×rAF (prototype selTab parity).
- Fidelity (parity workflow): Hero/Nav/CTA `.btn` arrow `<span class="arr">→</span>`; Hero `hero-mk draw` +
  `--len:140`; `.marquee-toggle` CSS; Capabilities `.meta` → one `<span>` per tag; Showcase mockRow `.lhs`+`.mi`
  icon; Stats/Work/Cap per-card `<Reveal delay={i*70}>` stagger; Testimonial+Footer mark = full 5 circles;
  Footer `.bn` wraps mark+wordmark, `.foot-bot` wrapped in `<span>`; CTA h2/body via `<Reveal as="h2"/"p">`
  (RevealTag widened to include h2/h3/h4).
- Intentional divergences kept (workflow-confirmed, NOT bugs): ThemeToggle in nav (spec: 2 themes), marquee
  pause button (WCAG 2.2.2), `<Link>` vs `<button>` locale toggle (Next routing), `<ul>/<li>` logos (semantic).
- Gotcha: `reuseExistingServer:true` in playwright.config means a stale :3000 server skips rebuild → kill the
  port before every verify or visaudit reads the OLD build. The PostToolUse prettier hook also rewrites files
  on Write → Read-immediately-before-Write each file to avoid "modified since read".

**Why a handoff doc:** earlier sessions hit harness output-truncation under context pressure (Read/Glob/PowerShell
returned empty; parallel tool batches cascade-cancelled). Reliable channels: Write results, background-task
exit-code notifications, subagent reports, and `.json` diagnostics written by temp Playwright specs.

**⚠️ CRITICAL SCHEMA CORRECTION (do not repeat the earlier mistake):** the FIRST schema-map subagent
HALLUCINATED field names. The AUTHORITATIVE names are in `src/payload-types.ts` (verified). Use EXACTLY:
- Hero: `kicker`, `headline`(richText), `subhead`(richText), `trustLabel`, `primaryCtaLabel`, `secondaryCtaLabel` (NO href fields — CTAs link to #work / #contact in markup).
- NavLabel: `capabilities`,`platform`,`work`,`process`,`ctaLabel`.
- Marquee: `heading`. Marquee logos come from the `client-logos` collection (`name`).
- SectionHeading: `headings[]` {`number`(mono), `title`(richText), `subtitle`} — an ORDERED ARRAY (01..04 = capabilities/platform/work/process), NOT keyed.
- Testimonial: `quote`(richText), `attribution`(richText).
- CallToAction: `kicker`, `heading`(richText), `body`, `email`(mono), `bookCallLabel`, `socialLinks[]`{label(mono),url(mono)}. (No separate emphasis field — emphasis is inside the richText.)
- Footer: `blurb`, `studioLinks[]`{label(loc),anchor(mono)}, `connectLinks[]`{label(mono),url(mono)}, `bottomNote`. **NOTE: no `studioHeading`/`connectHeading` fields** — render the "Studio"/"Connect" column headings as localized constants in the Footer component (flag for Phase 4 schema add).
- SeoMetadatum: `title`, `description`, `ogImage`(upload→Media.url).
- Stats(`stats`): order,value(num,mono),unit(mono),label(loc). Capabilities(`capabilities`): order,categoryLabel(mono),icon(select automation/tools/systems/leverage),title,description,`tags[]`{value(mono)}. CaseStudies(`case-studies`): order,tag(mono),glyph(mono),title,description,`metricsLine`(richText). ProcessSteps(`process-steps`): order,number(mono),name(loc),title,description,`checklist[]`{point(loc)}. ClientLogos(`client-logos`): order,name(mono). ShowcaseSurfaces(`showcase-surfaces`): order,tabName(mono),tabTitle(loc),tabDescription(loc),`panel`(BLOCKS: mockRow{name,sub,pillLabel,pillKind ok/run}, kpiGrid{items[]{value,label}}, chart{bars[]{height}}, codeLines{lines[]{text,kind comment/keyword/string/plain}}).

### Phase 3 DONE this session (verify each EXISTS on disk first — some Writes may not have persisted):
- **T027 `tests/unit/content.spec.ts`** — unit tests for content layer (pure fns). CONFIRMED on disk. Earlier ran GREEN against v1; rewritten to the corrected schema. **Re-run `pnpm exec vitest run tests/unit/content.spec.ts` to confirm GREEN.**
- **T028+T045 `src/lib/content.ts`** — REWRITTEN to correct schema (above). Exports: ordered, pick, omitIfEmpty, lexicalToPlainText, safeSection, map{Stats,Capabilities,CaseStudies,ProcessSteps,ClientLogos,ShowcaseSurfaces}, getSiteContent(locale), headingByNumber, type RichTextValue + all VMs. Lazy-imports payload (so unit test needs no DB). published-only + sort:'order' + fallbackLocale + safeSection graceful-degrade. **VERIFY it persisted (was missing once); re-Write from this conversation if absent.**
- **`src/lib/richtext.tsx`** — Lexical→React serializer: `RichInline` (inline, for headings/quotes) + `RichText` (block). italic→`<em>`, bold→`<strong>`. **VERIFY persisted (was missing).**
- **`tests/setup.ts`** — jest-dom + `logger.level='silent'`. CONFIRMED on disk.
- **`src/styles/components.css`** (1483 lines) — FULL enterprise.css port using existing tokens, both themes (AA), all §5 breakpoints, motion-off resets. CONFIRMED (subagent). `@import './components.css'` added at globals.css line 3 (after tokens). Selector list is in the progress log below.
- **E2E specs T021–T026,T027a** in `tests/e2e/`: helpers.ts + us1-{sections,i18n,theme,a11y,motion,responsive,mono-labels}.spec.ts. **WERE MISSING on last Glob — re-create from this conversation** (full text exists in session-3 transcript). They define the page's test contract (data-testids in helpers.ts: site-nav, lang-en, lang-th, theme-toggle, section-hero/marquee/marquee-toggle/stats/capabilities/showcase/work/process/testimonial/cta, site-footer).
- **T020 seed**: marked [X] in tasks.md this session (was done+committed in Phase 2 but checkbox lagged).

### Phase 3 REMAINING (build, then verify via `pnpm build` exit code + run e2e):
1. **Primitives T029/T030** `src/components/primitives/`: Button{href,variant solid/ghost,magnetic} `<a class="btn[ solid]" data-magnetic>`, Pill{kind ok/run} `<span class="pill">`, Reveal(client, IO .reveal→.in, motion-off=show), Counter(client, 0→value 1400ms ease-out, renders `<span class="v"><span>{n}</span><span class="u">{unit}</span></span>`, SSR=final, motion-off=instant), LatticeCanvas(client, variants hero/cta/thumb per design §4.9, aria-hidden, pause offscreen, motion-off=1 static frame). [A subagent prompt for this was written in session 3 but the dispatch was cancelled — re-dispatch.]
2. **Layout T031/T032** `src/components/layout/`: Nav.tsx{nav:NavVM} (header>nav[data-testid=site-nav,aria-label=Primary], brand inline #mark svg + "Wrenfield Works", 4 section links #capabilities/#platform/#work/#process, LangToggle, ThemeToggle, CTA Button→#contact; add .scrolled on scrollY>24). CustomCursor.tsx (client; off on coarse-pointer/touch/motion-off; never hide focus). Update LangToggle/ThemeToggle to add testids lang-en/lang-th/theme-toggle + aria + cookie persistence (LangToggle = Link to /{lang} swapping the leading segment + set `wf-locale` cookie). **Verify `src/proxy.ts` sets `wf-locale` cookie on /en|/th visits so bare `/` redirects to remembered locale** (needed for T022 persistence test).
3. **Sections T033–T041** `src/components/sections/` (server comps using VMs + richtext + primitives + the components.css classes): Hero, Marquee(+ `marquee-toggle` button toggling `data-paused` on `[data-testid=section-marquee]` + aria-pressed), Stats(Counter), Capabilities, Showcase(tabs role=tab/tablist/tabpanel, render `panel` blocks by blockType, first active), Work(case cards + LatticeCanvas thumb variant), Process(sticky), Testimonial, CTA(+ LatticeCanvas cta), Footer. Each `<section id=.. data-testid=section-..>` with proper headings (h1 hero ONLY; sections h2; cards h3/h4) + landmarks (one banner=Nav, one `<main>`, one `<footer data-testid=site-footer>`=contentinfo).
4. **T042 page** replace `src/app/(frontend)/[locale]/page.tsx`: `const c = await getSiteContent(locale)`; render Nav + `<main>` with sections conditionally (skip null sections — graceful/empty T045); pass headingByNumber(c.sectionHeadings,'01'..) to sections; CustomCursor. **T043 SEO**: per-locale `generateMetadata` in layout or page from c.seo (title/description/OG) + html lang (layout already sets lang + lang-th class + themeBootScript). **T044**: heading order + landmarks (done via component structure). **T045**: graceful in content.ts (done) + page-level null-skips.
5. **VERIFY (background + exit code):** `pnpm exec tsc --noEmit` (0), `pnpm build` (0, SSRs page against seeded DB — DB is up+seeded), `pnpm exec vitest run` (unit GREEN), then E2E: `pnpm exec playwright install chromium` then `pnpm test:e2e` (needs build+start; playwright.config webServer does `pnpm build && pnpm start`; baseURL :3000). Honor TDD: e2e were authored first (RED vs placeholder) → should pass once page built.
6. Mark T021–T045 [X] in tasks.md; update this doc; commit `[Phase 3]` (only when user asks).

### Tips for the rebuild
- Delegate big chunks to subagents (they work in a clean context where file ops + builds succeed — the CSS port subagent worked perfectly). Dispatch ONE agent per message (parallel batches cascade-cancel under load). Use a verify-subagent to run tsc/build/vitest and report verbatim.
- Don't trust empty foreground outputs as "nothing there" — confirm via background exit codes or a subagent.

---
**Phase 1 (T001–T008) + Phase 2 (T009–T020) COMPLETE & committed.** HEAD = `5b9ca91`. Working tree had Phase-3 WIP at handoff. Postgres running in Docker (`wrenfieldworks-db-1`, healthy, port 5432) and SEEDED (8 globals + 25 rows, bilingual, published). Tasks T001–T020 marked [X] in tasks.md.
- To run locally: set env (PAYLOAD_SECRET=devsecretdevsecretdevsecret012345, DATABASE_URI=postgres://wrenfield:wrenfield@localhost:5432/wrenfield, NEXT_PUBLIC_SERVER_URL=http://localhost:3000, NODE_ENV=development), then `pnpm dev`. `/en` `/th` render a PLACEHOLDER page (real design = Phase 3). `/admin` = Payload (create first user). `/health` = db probe. `pnpm seed` is idempotent.
- **NEXT: Phase 3 = User Story 1 (T021–T045), the MVP public site.** TDD MANDATORY: write e2e/unit tests FIRST (T021–T027a, must fail) → then content read layer (T028 `src/lib/content.ts`, locale-scoped, published-only, **sort by `order`**, fallback, empty-collection→omit, via Payload Local API getPayload({config})) → primitives (T029 Button/Pill/Reveal/Counter, T030 LatticeCanvas, T031 CustomCursor+magnetic) → T032 Nav (LangToggle/ThemeToggle ALREADY built in src/components/layout!) → sections T033–T041 (Hero/Marquee/Stats/Capabilities/Showcase/Work/Process/Testimonial/CTA+Footer) → T042 compose page (replace placeholder `src/app/(frontend)/[locale]/page.tsx`) → T043 per-locale SEO metadata → T044 heading order+landmarks → T045 graceful fail/empty collapse.
- Design fidelity: ALL tokens already in `src/styles/tokens.css`; full component CSS, lattice constants, animation timings, breakpoints, and section structure are in `specs/001-enterprise-site-cms/design-extract.md` (§3 structure, §4 interactions, §5 breakpoints). Port enterprise.css component styles into globals.css/component CSS using existing tokens. Honor prefers-reduced-motion (theme boot script sets body.motion-off).
- Reuse: LangToggle.tsx, ThemeToggle.tsx, ThemeProvider (src/components), content via Payload Local API, fields helpers. monoText fields = English-only both locales (FR-011).
- Read first on resume: this file, then `design-extract.md`, then `tasks.md` (T021+). Memory file: `payload-next16-gotchas.md` (pnpm hoisted, payload-run top-level await, locale:all gate, carryIds).
## >>> END RESUME <<<

- App code scaffolded through Phase 2 (was: not yet scaffolded).
- NOTE: large tool outputs get truncated from the user's view → keep reads chunked, commands quiet, offload to files.

## Stack (from plan.md)
Single Next.js 16 (App Router, React 19) app with Payload CMS 3.x embedded + PostgreSQL 16 (Drizzle adapter `@payloadcms/db-postgres`). Tailwind CSS 4 + ported design tokens. Zod validation, Pino logging, React Email + SMTP, cookieless analytics (Plausible/Umami), Cloudflare Turnstile. Hosted Singapore (PDPA). Bilingual EN(default)/TH. Dark(default)+paper themes.
- Next 16 specifics: `src/proxy.ts` (NOT middleware.ts; export `proxy`, Node runtime) for `/en` `/th` locale routing.
- Project layout: `src/app/(frontend)/[locale]/`, `src/app/(payload)/`, `src/app/api/inquiries/`, `src/collections/`, `src/globals/`, `src/components/{layout,sections,primitives}`, `src/lib/{validation,...}`, `src/styles/`, `src/payload.config.ts`, `tests/{unit,integration,e2e}`.

## Gates (Constitution v1.0.1 — binding; I & II NON-NEGOTIABLE)
- **Security**: deny-by-default access; Zod-validate all external input; secrets via env only; TLS; dep scan no high/critical; CSRF/XSS/injection protection; bcrypt (Payload).
- **TDD**: tests written BEFORE impl, must fail first (Red-Green-Refactor). Bug fix starts with failing test.
- **i18n**: both EN+TH required before publish (enforced hook FR-014); no hardcoded user-facing strings; locale-aware formatting; Thai typography (line-height ≥1.25, no negative tracking, reduced Thai display scale).
- **UX**: explicit loading/empty/error states; localized actionable errors; WCAG 2.1 AA on public AND back office, BOTH themes.
- **Perf budgets (CI/Lighthouse)**: LCP<2.5s, INP<200ms, CLS<0.1, public route JS ≤200KB gz, usable <3s on mid-tier 4G. Content read p95<300ms, inquiry p95<800ms.
- **UI**: token-driven reusable components, responsive 360→1440px, all visual states defined.
- **Code quality**: ESLint+Prettier+tsc strict; ≥80% coverage on business-logic (`src/lib/**`, hooks, access, validation, retention, email); PR review.

## Checklists status: ALL PASS (90/90: a11y 16, ux 19, requirements 16, i18n 19, security 20).

## Key design facts (handoff: docs/Frist Pilot-handoff/frist-pilot/project/)
- Source files: `enterprise.css` (339L tokens+styles), `enterprise.js` (278L interactions), `i18n.js` (103L EN/TH content), `Wrenfield Works - Enterprise.html` (376L structure). SVG assets: favicon, lattice, lockup-on-dark, mark-brass, mark-ink.
- Dark tokens (`:root`): --ink #0b0b0e, --ink-soft #14141a, --paper #f7f5f0, --paper-dim #e9e5dd, --brass #c9a35e, --brass-bright #e0bd78, --line rgba(247,245,240,.12), --line-strong rgba(247,245,240,.24), --muted rgba(247,245,240,.62), --muted-soft rgba(247,245,240,.42), --r 14px, --maxw 1120px, --pad clamp(20px,5vw,64px), --ease cubic-bezier(.22,1,.36,1). Fonts: sans=Hanken Grotesk, serif=Fraunces, mono=JetBrains Mono, th-sans=Anuphan/IBM Plex Sans Thai, th-serif=Trirong.
- **Full token detail + paper theme override + COMPLETE EN/TH content inventory** → see `specs/001-enterprise-site-cms/design-extract.md` (generated by subagent). READ THAT for tokens + seed content.
- Sections in order: lattice-bg, cursor-dot, nav, hero, marquee, stats, capabilities, platform showcase (tabs), selected work/case studies, process, testimonial, CTA/contact, footer.
- Brand clients in hero trust strip: Northwind, Lumen, Apsis, Vault. (data-model marquee logos also reference Northbound etc — reconcile from i18n.js seed.)

## Data model summary (data-model.md)
- **Globals** (singletons, drafts+versions, localized): Hero, NavLabels, Marquee, SectionHeadings(repeating group of 4), Testimonial, CallToAction, Footer, SEOMetadata.
- **Collections** (ordered, drafts+versions): Capabilities, CaseStudies, ProcessSteps, Stats, ClientLogos, ShowcaseSurfaces, Inquiries, Users(staff role), Media(localized alt).
- Localized = separate EN/TH. mono = non-localized (section numbers 01–04, category tags, KPI units, status pills, brand/client names, email/URL).
- Inquiries fields: name,email,message,locale(en/th),consent(must=true),consentAt,submittedAt,expiresAt(=+24mo),status(new/read/archived). Access: create=public via /api/inquiries only; read/update/delete=staff. Index expiresAt + status.
- Publish hook blocks publish if any localized field missing EN or TH (FR-014).

## Contracts
- **content-api**: published-only, locale-scoped reads via Payload Local API, ordered by `order`; empty collection → section omitted; missing locale → fallback to other locale; static + on-demand revalidation on publish.
- **inquiry-api**: `POST /api/inquiries` JSON {name,email,message,locale,consent,turnstileToken,company(honeypot)}. Zod validate; consent===true; verify turnstile; honeypot empty; rate limit 5/IP/hr→429. 201 {ok,message(localized)}; 400 {ok:false,errors}; 429; 500. afterChange email best-effort (failure logged, never rolls back). Frontend emits cookieless `inquiry_submitted` on 201.
- **admin-auth**: Payload auth, deny-by-default, bcrypt, CSRF on mutations, single staff role full access. Access table per resource. Publish completeness beforeChange hook. Optimistic concurrency via version/updatedAt → reject stale save. Versions = audit trail. Inbox lists name/email/message/locale/submittedAt/status.

## Execution plan (phase = checkpoint boundary)
Tasks file: `specs/001-enterprise-site-cms/tasks.md` (T001–T085). Mark `[X]` as completed.

- **Phase 1 Setup (T001–T008)** — FOREGROUND (stateful scaffold+install). Sequential: T001 Next16+TS, T002 Payload+db-postgres+payload.config skeleton. Parallel-ish files: T003 eslint/prettier/tsconfig strict, T004 vitest/playwright/axe, T005 docker-compose(pg16)+.env.example, T006 tokens.css(dark+paper)+tailwind, T007 fonts(font-display swap), T008 CI workflow. **Verify: pnpm install ok, pnpm dev boots, /admin reachable.** Risk: Payload 3 ↔ Next 16 peer-dep compat — verify on install, adjust versions if needed.
- **Phase 2 Foundational (T009–T020)** — BLOCKS all stories. T009 pg adapter, T010 localization en/th, T011 Users, T012 Media, T013 ordered collections[P], T014 globals[P], T015 publish-completeness hook + wire all, T016 Pino logging, T016a observability+health, T017 proxy.ts locale routing+i18n helper, T018 theme system(dark+paper persistent toggle), T019 base locale layout+providers+globals.css, T020 seed script (EN/TH from design-extract.md). Collections/globals = good fan-out (separate files), then I wire payload.config.
- **Phase 3 US1 (T021–T045)** — MVP. Tests first (T021–T027a, must fail), then content read layer (T028), primitives (T029–T031: Button/Pill/Reveal/Counter, LatticeCanvas, CustomCursor+magnetic), nav/toggles (T032), sections (T033–T041), page compose (T042), SEO (T043), heading/landmarks (T044), graceful fail/empty (T045).
- **Phase 4 US2 (T046–T063)** — CMS. Tests first (T046–T052), then auth/access (T053–T054), publish gate UX (T055), draft/preview (T056), conflict detection (T057), validation (T058), collection mgmt UX (T059), SEO editing (T060), audit trail (T061), on-publish revalidation (T062), CSRF/XSS (T063).
- **Phase 5 US3 (T064–T078)** — Inquiries/PDPA. Tests first (T064–T069), then Inquiries collection (T070), Zod schema (T071), API route (T072), form UI (T073), email isolation (T074), inbox+delete (T075), retention job (T076), Singapore/TLS config (T077), cookieless analytics (T078).
- **Phase 6 Polish (T079–T085)** — Lighthouse gate, a11y manual pass, dep scan + no-secrets, coverage ≥80% gate, docs/README/.env.example, quickstart verification, long-text(+50%) checks.

## Progress log
- 2026-05-31: Context fully gathered (spec, plan, data-model, research, quickstart, constitution, 3 contracts, tasks, checklists). Design handoff located + extraction subagent dispatched → design-extract.md. Toolchain verified.
- 2026-05-31: **Phase 1 files authored.** Locked versions: next 16.2.6, react/react-dom 19.2.6, payload stack 3.85.0, graphql ^16.11, sharp ^0.34.2 (Payload 3.85 peer dep explicitly allows next >=16.2.6 <17 → combo SUPPORTED). Wrote: package.json (+pnpm.onlyBuiltDependencies: @tailwindcss/oxide,esbuild,sharp,unrs-resolver,@swc/core), .npmrc, tsconfig.json (@payload-config + @/* paths, strict), next.config.mjs (withPayload), postcss.config.mjs (tailwind v4), eslint.config.mjs (FlatCompat next+prettier), vitest.config.ts (coverage v8 ≥80% on lib/collections/globals/access), playwright.config.ts (chromium+mobile, webServer build+start), .prettierrc/.prettierignore, .gitignore, .dockerignore, .env.example (template, no secrets — secret-hook later removed by user), docker-compose.yml (pg16). src/payload.config.ts (postgresAdapter, localization en+th fallback, lexical, empty collections/globals, cors/csrf). src/app/(payload)/* full route-group boilerplate (layout, admin page+not-found, api rest+graphql+playground, custom.scss, importMap.js). src/app/(frontend)/[locale]/layout.tsx (renders html/body, fonts, lang) + page.tsx (EN/TH placeholder). src/lib/fonts.ts (Fraunces/Hanken/JetBrains + Trirong/Anuphan/IBMPlexThai, swap, CSS vars). src/styles/tokens.css (dark :root + body.paper, +tokenized positive/lattice/cursor/glow for paper AA; paper accent-deep darkened to #8a6a30, fg3 #6a6256, positive #2f7a45) + globals.css (reset, focus-visible, prefers-reduced-motion). .github/workflows/ci.yml (quality/test/e2e/lighthouse/security jobs) + lighthouserc.json.
- 2026-05-31: `pnpm install` exit 0 (1m49s); reinstalled after adding build allowlist + devDeps (@eslint/eslintrc, eslint-config-prettier, @vitest/coverage-v8). Ran `payload generate:types` + `generate:importmap`.
- 2026-05-31: **PHASE 1 COMPLETE & VERIFIED (T001–T008 marked [X]).** Fixes applied during verify: (1) `.npmrc` node-linker=hoisted (pnpm isolated symlinks broke Payload deep-subpath resolution), (2) graphql/route.ts — removed nonexistent `GRAPHQL_OPTIONS` export (only GRAPHQL_POST exists), (3) created `src/collections/Users.ts` minimal auth collection + registered in payload.config (admin.user='users' requires a real auth collection or sanitize throws), (4) next.config.mjs turbopack.root pinned. Results: `payload generate:types` exit 0 → src/payload-types.ts written; **`pnpm build` exit 0 — Compiled in 19.9s, 9/9 static pages generated** (en/th frontend + payload admin/api). Created tests/{unit,integration,e2e} + src/seed dirs (.gitkeep). DEFERRED: Docker daemon not running (Docker Desktop closed) → `docker compose up db` failed — environment only, not code; DB needed for `pnpm dev`/seed/integration tests in Phase 2. User must start Docker Desktop. Known non-blocking warning: stray `C:\Users\Jiraw\package-lock.json` makes Next warn about workspace root (turbopack.root set but it's a file outside the project; left for user to remove).
- 2026-05-31: **Phase 1 committed (21feaa4, 46 files).** Postgres now running (Docker started by user; `wrenfieldworks-db-1` healthy, port 5432, accepting connections). Untracked temp artifacts (.exit/.log) via .gitignore.

## PHASE 2 COMPLETE & VERIFIED (T009–T020 all [X])
> Final verify: tsc=0, build exit 0, seed exit 0 (8 globals + 25 rows). Publish gate (FR-014) proven by negative test (EN-only stat → BLOCKED) + positive (bilingual → PUBLISHED). DB nested-array bilingual proof: section_headings en4/th4, process checklist en9/th9, showcase mockRow en5/th5, real Thai text stored.
> 3 debugged root causes (systematic-debugging skill, evidence-first): (1) `payload run` only awaits top-level → seed needed `await main()` not `main().catch()`; (2) TH array writes need EN row `id`s carried in (`carryIds`) or Payload replaces rows; (3) publish hook must read `locale:'all'` (NOT per-locale — `fallback:true` masks missing TH). Lesson: exit 0 ≠ success; verify DB row counts.

### (original in-progress notes follow)
**Shared foundations authored (DONE, on disk):**
- `src/access/index.ts` — isStaff, publishedOrStaff (public sees _status=published only), denyAll, anyone.
- `src/lib/logging.ts` — Pino (T016), redacts secrets/email. Added `pino ^9.5.0` to deps + installed (exit 0).
- `src/lib/observability.ts` — incr/trace/metricsSnapshot (T016a).
- `src/lib/i18n.ts` — LOCALES, DEFAULT_LOCALE='en', LOCALE_COOKIE='wf-locale', normalizeLocale, localeFromAcceptLanguage.
- `src/lib/validation/publishCompleteness.ts` — FR-014 gate (T015): on _status==='published', fetch locale:'all', merge incoming active-locale, walk schema, throw APIError listing missing EN/TH localized leaves. Handles group/array/blocks/tabs/row. Exports `__test` helpers for unit tests.
- `src/fields/localized.ts` — localizedText/Textarea/RichText, monoText, orderField helpers.
- `src/proxy.ts` — T017 locale routing (Next16 proxy export). Excludes /admin /api /_next /health /favicon + files. Redirects bare path → cookie→Accept-Language→en. matcher set.
- `src/lib/theme.ts` — THEMES dark/paper, themeBootScript (pre-paint, sets paper class + motion-off from prefers-reduced-motion).
- `src/components/providers/ThemeProvider.tsx` — client, toggles body.paper, persists wf-theme.
- `src/components/layout/ThemeToggle.tsx` + `LangToggle.tsx` — accessible (aria-pressed), localized labels.
- `src/app/health/route.ts` — T016a health (db probe via users count → 200/503 + metrics).
- `src/app/(frontend)/[locale]/layout.tsx` — UPDATED T019: renders html/body, fontVariables, themeBootScript, ThemeProvider, notFound() on bad locale.

**Collections+Globals: WORKFLOW RUNNING (background, Task wtr8a91dl / run wf_d4ee3e3e-127).** Fan-out 1 agent per file writing to src/collections/*.ts (Stats, ClientLogos, Capabilities, CaseStudies, ProcessSteps, ShowcaseSurfaces, Media) + src/globals/*.ts (Hero, NavLabels, Marquee, SectionHeadings, Testimonial, CallToAction, Footer, SEOMetadata). Each uses shared helpers, versions:{drafts:true}, access rules, publishCompletenessHook. Slugs: stats, client-logos, capabilities, case-studies, process-steps, showcase-surfaces, media, hero, nav-labels, marquee, section-headings, testimonial, call-to-action, footer, seo-metadata. **CHECK workflow result when notified.**

### IMMEDIATE NEXT STEPS (resume here)
1. **Verify workflow output**: confirm all 15 files written to src/collections + src/globals. Read a couple to confirm they compile against helpers.
2. **Wire payload.config.ts (T009/T010/T013/T014)**: import all collections+globals, replace `collections:[Users]` → `[Users, Media, Stats, ClientLogos, Capabilities, CaseStudies, ProcessSteps, ShowcaseSurfaces]`, set `globals:[Hero, NavLabels, Marquee, SectionHeadings, Testimonial, CallToAction, Footer, SEOMetadata]`. Wire publish hook is per-file already. (localization en/th already in config.)
3. **T011 Users**: upgrade `src/collections/Users.ts` from minimal to deny-by-default access (read/create/update/delete = isStaff), add `name` already there; keep auth:true.
4. **T020 seed** (`src/seed/seed.ts`, `pnpm seed` already in package.json → `payload run src/seed/seed.ts`): use BYTE-EXACT EN/TH from design-extract.md §6 (38 keys table, lines ~255–352). Stats values: 60+/40%/10×/100%. Marquee logos: Northbound®, Siriphan Group, Halcyon Labs, Meridian Freight, Kasem & Co., Atlas Retail, Verdant Health, Rung Capital. Capabilities 4 (icons automation/tools/systems/leverage). Case studies 3 (glyphs C/A/T). Process 3 (01/02/03). Showcase 3 surfaces (A·Automation/B·Internal tools/C·Custom systems) with panel blocks. Delegate to subagent that reads design-extract.md fully. Seed must upsert globals + create collection rows + publish them (_status:'published', both locales).
5. **Verify Phase 2**: `pnpm generate:types` (exit 0), `pnpm build` (exit 0), then `pnpm seed` against running pg, then `pnpm dev` → check /en /th render + /admin loads. Mark T009–T020 [X]. Commit `[Phase 2]`.
6. Then Phase 3 US1 (TDD: tests T021–T027a FIRST, must fail, then impl T028–T045).

### Gotchas confirmed this session
- pnpm needs `node-linker=hoisted` (.npmrc) + `pnpm.onlyBuiltDependencies` (package.json) — already set. If "Ignored build scripts" reappears after dep changes, `pnpm rebuild esbuild sharp unrs-resolver`.
- `@payloadcms/next/routes` graphql route: ONLY `GRAPHQL_POST` (no GRAPHQL_OPTIONS) — already fixed.
- admin.user requires a real auth collection registered → Users must stay in collections[].
- PowerShell `*>` logs are UTF-16 — read with Get-Content not Read tool.
- Build env vars needed: PAYLOAD_SECRET, DATABASE_URI, NEXT_PUBLIC_SERVER_URL (set inline for manual runs; CI sets them).
- Run build/install in background (run_in_background) — outputs truncate from user view but task-completion notifications are reliable.
- NOTE: tool-result output is being truncated from view under context pressure; background-task completion notifications still arrive cleanly (use them as the verification channel). PowerShell `*>` logs are UTF-16 — read them with `Get-Content` (PowerShell tool), NOT the Read tool (which shows them garbled/spaced).
- 2026-05-31: **First build FAILED** — `Module not found: Can't resolve '@payloadcms/next/views'`. Root cause: pnpm default isolated node_modules symlinks break Next's resolution of Payload deep subpath exports (verified: export map + dist file exist, but pkg is a SymbolicLink). **FIX: added `node-linker=hoisted` to .npmrc** → removed node_modules → clean reinstall (background). After it succeeds: `pnpm generate:types` then `pnpm build` must pass before marking T001–T008 done. Also pnpm kept reporting "Ignored build scripts: esbuild, sharp, unrs-resolver" — onlyBuiltDependencies only runs scripts on fresh link, so the clean reinstall should execute them; if it still warns, run `pnpm rebuild esbuild sharp unrs-resolver`.

## Open risks / decisions
- Payload 3.x official baseline is Next 15; Next 16 is bleeding-edge. Confirm compatible versions at install (Context7 / npm). If blocked, pin latest Payload that supports Next 16, or fall back to Next 15 + note deviation (would need user OK since plan mandates Next 16).
- Turnstile/SMTP/analytics/S3 are external — use env + dev-safe stubs; real keys out of scope for local. Tests must not depend on live external calls (mock).
- Seed content must be byte-exact EN/TH from i18n.js (see design-extract.md §6).
