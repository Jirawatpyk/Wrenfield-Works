/**
 * Seed script — Wrenfield Works Enterprise Site + CMS (T020, FR-009)
 *
 * Seeds the public site with byte-exact bilingual EN/TH content ported verbatim
 * from the approved design's `i18n.js` DICT, captured in
 * `specs/001-enterprise-site-cms/design-extract.md` (§3.5–§3.8 + §6), so the
 * site is meaningful before editors make any changes.
 *
 * Strings are copied character-for-character: Thai text, em-dashes (—), middots
 * (·), the minus sign (−), the half glyph (½), the multiply sign (×), the baht
 * sign (฿), %, +, the arrows (→ ↔), the registered mark (®), and ampersands (&).
 * Inline `<em>`/`<b>` markup from the DICT is reduced to plain text for the seed
 * (the design markup is reproduced by the public template, not the stored value).
 *
 * Run via: `pnpm seed` → `payload run src/seed/seed.ts`
 *
 * --- Localized write order (publish-completeness gate, FR-014) ---------------
 * Localized writes happen ONE LOCALE AT A TIME via the `locale` param. The
 * `publishCompletenessHook` (beforeValidate) throws if a write transitions to
 * `published` while any localized field is missing EN or TH. So every document
 * follows this exact order:
 *   1. write EN as draft   (locale 'en', `_status: 'draft'`)
 *   2. write TH as draft   (locale 'th', same doc — by id for collections)
 *   3. publish             (final update, `_status: 'published'`)
 * By step 3 the hook re-reads ALL locales and finds both present, so it passes.
 *
 * The hook's merge replaces array/blocks wholesale from the incoming write, so
 * the TH write of a collection must include the FULL localized structure (e.g.
 * the entire `panel` blocks array with Thai labels), not a partial patch.
 *
 * Every call passes `overrideAccess: true` (seed runs without a logged-in user).
 */

import { getPayload } from 'payload'
import config from '@payload-config'

type Json = Record<string, unknown>

/**
 * Minimal valid Lexical value for a richText field: one paragraph, one text node
 * holding the plain-text content (inline `<em>`/`<b>` from the DICT is stripped).
 */
const rt = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
            text,
            version: 1,
          },
        ],
      },
    ],
  },
})

// `payload run` executes this file as an ES module and only awaits TOP-LEVEL
// promises. Running the work inside a function called fire-and-forget would let
// the process exit before it ran (exit 0 with an empty DB). So `main()` is
// awaited at the top level below.
/**
 * Carry Payload row ids from EN array rows into TH array rows, by position,
 * recursing into nested arrays. Only ever touches array ELEMENTS — never the
 * enclosing document — so no stray top-level id leaks into the payload.
 */
function withRowIds(sourceArr: unknown, targetArr: unknown[]): unknown[] {
  const src = Array.isArray(sourceArr) ? sourceArr : []
  return targetArr.map((row, i) => {
    const s = src[i]
    if (row && s && typeof row === 'object' && typeof s === 'object') {
      const out: Json = { ...(row as Json) }
      const sObj = s as Json
      if (sObj.id !== undefined && out.id === undefined) out.id = sObj.id
      for (const k of Object.keys(out)) {
        if (Array.isArray(out[k]) && Array.isArray(sObj[k])) {
          out[k] = withRowIds(sObj[k], out[k] as unknown[])
        }
      }
      return out
    }
    return row
  })
}

/**
 * Localized leaves (e.g. `headings[].title`) live inside NON-localized array
 * rows that Payload identifies by `id`. Writing the Thai locale with array rows
 * that have no `id` makes Payload REPLACE the rows, dropping the English values
 * written first — so the publish-completeness gate (FR-014) then rejects the doc.
 * This copies the EN-created ids into every top-level array field of the Thai
 * payload, turning the Thai write into an update of the same rows so both locales
 * survive. Pure (returns a new object; no mutation of inputs).
 */
function carryIds(enDoc: Json, th: Json): Json {
  const out: Json = { ...th }
  for (const k of Object.keys(out)) {
    if (Array.isArray(out[k])) out[k] = withRowIds(enDoc?.[k], out[k] as unknown[])
  }
  return out
}

const main = async () => {
  const payload = await getPayload({ config })
  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Global: EN draft → TH draft → publish. */
  const seedGlobal = async (slug: string, en: Json, th: Json) => {
    const enDoc = await payload.updateGlobal({
      slug: slug as never,
      locale: 'en',
      data: { ...en, _status: 'draft' } as never,
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: slug as never,
      locale: 'th',
      // Carry EN row ids so localized fields inside arrays keep both locales.
      data: { ...carryIds(enDoc as Json, th), _status: 'draft' } as never,
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: slug as never,
      locale: 'en',
      data: { _status: 'published' } as never,
      overrideAccess: true,
    })
    log(`global '${slug}' seeded`)
  }

  /** Wipe a collection so the script is idempotent. */
  const clearCollection = async (collection: string) => {
    try {
      await payload.delete({
        collection: collection as never,
        where: {} as never,
        overrideAccess: true,
      })
    } catch {
      // collection may be empty / not yet have rows — ignore
    }
  }

  /** One collection row: EN draft create → TH draft update → publish. */
  const seedRow = async (collection: string, en: Json, th: Json, order: number) => {
    const doc = await payload.create({
      collection: collection as never,
      locale: 'en',
      data: { ...en, order, _status: 'draft' } as never,
      overrideAccess: true,
    })
    const id = (doc as { id: string | number }).id
    await payload.update({
      collection: collection as never,
      id,
      locale: 'th',
      // Carry EN row ids so localized fields inside arrays keep both locales.
      data: carryIds(doc as Json, th) as never,
      overrideAccess: true,
    })
    await payload.update({
      collection: collection as never,
      id,
      data: { _status: 'published' } as never,
      overrideAccess: true,
    })
  }

  /**
   * Seed an ordered collection from `[{ en, th }]`, assigning `order` 0,1,2…
   * by position. Wipes the collection first so the script is idempotent.
   */
  const seedRows = async (collection: string, rows: Array<{ en: Json; th: Json }>) => {
    await clearCollection(collection)
    let order = 0
    for (const { en, th } of rows) {
      await seedRow(collection, en, th, order)
      order += 1
    }
    log(`collection '${collection}' seeded (${rows.length})`)
  }

  log('starting seed…')

  // ===========================================================================
  // GLOBALS
  // ===========================================================================

  // --- Hero -----------------------------------------------------------------
  // headline/subhead/trust = DICT hero_h1 / hero_sub / hero_trust (plain text).
  // kicker has no TH in DICT (EN-only by design) → a sensible Thai is supplied
  // so the publish gate passes (FR-014, design-extract §6.2).
  await seedGlobal(
    'hero',
    {
      kicker: 'AI-assisted systems, built right.',
      headline: rt("Production systems for teams that can't afford to break."),
      subhead: rt(
        'We design, build, and ship the automation, internal tools, and workflow platforms that run real businesses — from idea to deployed, end to end.',
      ),
      trustLabel: 'Trusted across CRM · automation · internal tooling · data platforms',
      primaryCtaLabel: 'See selected work',
      secondaryCtaLabel: 'Start a project',
    },
    {
      kicker: 'ระบบที่ใช้ AI ช่วย สร้างอย่างถูกต้อง',
      headline: rt('ระบบ production สำหรับทีมที่ ผิดพลาดไม่ได้'),
      subhead: rt(
        'เราออกแบบ สร้าง และส่งมอบระบบอัตโนมัติ เครื่องมือภายใน และแพลตฟอร์มเวิร์กโฟลว์ที่ขับเคลื่อนธุรกิจจริง — ตั้งแต่ไอเดียจนถึงการ deploy ครบวงจร',
      ),
      trustLabel: 'ไว้วางใจในงาน CRM · ระบบอัตโนมัติ · เครื่องมือภายใน · แพลตฟอร์มข้อมูล',
      primaryCtaLabel: 'ดูผลงานที่คัดมา',
      secondaryCtaLabel: 'เริ่มโปรเจกต์',
    },
  )

  // --- NavLabels (DICT nav_*; <span class="arr">→</span> stripped from cta) ---
  await seedGlobal(
    'nav-labels',
    {
      capabilities: 'Capabilities',
      platform: 'Platform',
      work: 'Work',
      process: 'Process',
      ctaLabel: 'Get in touch',
    },
    {
      capabilities: 'บริการ',
      platform: 'แพลตฟอร์ม',
      work: 'ผลงาน',
      process: 'กระบวนการ',
      ctaLabel: 'ติดต่อเรา',
    },
  )

  // --- Marquee (bilingual literal from design-extract §6.1, split per locale) -
  await seedGlobal(
    'marquee',
    { heading: 'Systems shipped for teams across industries' },
    { heading: 'ระบบที่ส่งมอบให้ทีมในหลากหลายอุตสาหกรรม' },
  )

  // --- SectionHeadings (4; DICT sec1..sec4; number mono set in EN write) ------
  await seedGlobal(
    'section-headings',
    {
      headings: [
        {
          number: '01',
          title: rt('What we build'),
          subtitle: 'Systems designed around how your team actually works',
        },
        {
          number: '02',
          title: rt('One practice, three surfaces'),
          subtitle: 'Switch between them — tap to see a real example',
        },
        {
          number: '03',
          title: rt('Selected work'),
          subtitle: 'Each started as a rough idea and became something a team uses daily',
        },
        {
          number: '04',
          title: rt('How we work'),
          subtitle: 'Clear, transparent, handed over clean',
        },
      ],
    },
    {
      headings: [
        {
          number: '01',
          title: rt('สิ่งที่เราสร้าง'),
          subtitle: 'ระบบที่ออกแบบรอบวิธีทำงานจริงของทีมคุณ',
        },
        {
          number: '02',
          title: rt('หนึ่งทีม สามด้านงาน'),
          subtitle: 'เลือกดูแต่ละด้าน — กดสลับเพื่อดูตัวอย่างจริง',
        },
        {
          number: '03',
          title: rt('ผลงานที่คัดมา'),
          subtitle: 'ทุกชิ้นเริ่มจากไอเดียคร่าว ๆ จนเป็นระบบที่ทีมใช้ทุกวัน',
        },
        {
          number: '04',
          title: rt('วิธีการทำงาน'),
          subtitle: 'ชัดเจน โปร่งใส ส่งมอบสะอาด',
        },
      ],
    },
  )

  // --- Testimonial (DICT quote / quote_by; <em>/<b> stripped) ----------------
  await seedGlobal(
    'testimonial',
    {
      quote: rt(
        '"We talked to the person actually doing the work. It shipped in weeks, survived our busiest quarter, and the handover was so clean our own team owns it now."',
      ),
      attribution: rt('— Operations Director · Meridian Freight'),
    },
    {
      quote: rt(
        '"เราได้คุยกับคนที่ลงมือทำจริง มันส่งมอบในไม่กี่สัปดาห์ รอดผ่านไตรมาสที่ยุ่งที่สุดของเรา และการส่งมอบสะอาดจนทีมเราเป็นเจ้าของเองได้เลย"',
      ),
      attribution: rt('— ผู้อำนวยการฝ่ายปฏิบัติการ · Meridian Freight'),
    },
  )

  // --- CallToAction ----------------------------------------------------------
  // kicker = §6.1 bilingual literal "Let's build · มาสร้างกัน" split per locale.
  // heading/body = DICT cta_h2 / cta_p; bookCallLabel = DICT cta_book.
  // email + socialLinks are mono — repeated so the TH draft is complete.
  await seedGlobal(
    'call-to-action',
    {
      kicker: "Let's build",
      heading: rt('Have something worth building?'),
      body: "Tell us what you're trying to ship. If it's a system, a tool, or an automation — it's probably in scope.",
      email: 'hello@wrenfieldworks.com',
      bookCallLabel: 'Book a call',
      socialLinks: [
        { label: 'LinkedIn', url: '#' },
        { label: 'GitHub', url: '#' },
        { label: 'X / Twitter', url: '#' },
      ],
    },
    {
      kicker: 'มาสร้างกัน',
      heading: rt('มีอะไรที่ควรค่าแก่การสร้าง?'),
      body: 'บอกเราว่าคุณกำลังจะส่งอะไร — ถ้าเป็นระบบ เครื่องมือ หรือ automation มันมักจะอยู่ในขอบเขตของเรา',
      email: 'hello@wrenfieldworks.com',
      bookCallLabel: 'นัดคุย',
      socialLinks: [
        { label: 'LinkedIn', url: '#' },
        { label: 'GitHub', url: '#' },
        { label: 'X / Twitter', url: '#' },
      ],
    },
  )

  // --- Footer ----------------------------------------------------------------
  // blurb = DICT foot_p. studioLinks reuse nav_* labels (localized) + anchors.
  // connectLinks are mono (Email/LinkedIn/GitHub/X / Twitter — design §6.2/§7).
  // bottomNote: §6.1 "© 2026 Wrenfield Works · แม่นยำ · ไม่โอ้อวด · มีรสนิยม" plus
  // the §3.11 footer bottom-left "AI-assisted systems, built right." — stored as
  // one field per locale: EN = left literal, TH = the Thai bottom-right literal.
  await seedGlobal(
    'footer',
    {
      blurb:
        'AI-assisted systems, built right. The independent practice that ships like a team ten times its size.',
      studioLinks: [
        { label: 'Capabilities', anchor: '#capabilities' },
        { label: 'Platform', anchor: '#platform' },
        { label: 'Work', anchor: '#work' },
        { label: 'Process', anchor: '#process' },
      ],
      connectLinks: [
        { label: 'Email', url: 'mailto:hello@wrenfieldworks.com' },
        { label: 'LinkedIn', url: '#' },
        { label: 'GitHub', url: '#' },
        { label: 'X / Twitter', url: '#' },
      ],
      bottomNote: 'AI-assisted systems, built right.',
    },
    {
      blurb: 'ระบบที่ใช้ AI สร้าง ทำมาอย่างถูกต้อง ทีมอิสระที่ส่งงานได้เหมือนทีมที่ใหญ่กว่าสิบเท่า',
      studioLinks: [
        { label: 'บริการ', anchor: '#capabilities' },
        { label: 'แพลตฟอร์ม', anchor: '#platform' },
        { label: 'ผลงาน', anchor: '#work' },
        { label: 'กระบวนการ', anchor: '#process' },
      ],
      connectLinks: [
        { label: 'Email', url: 'mailto:hello@wrenfieldworks.com' },
        { label: 'LinkedIn', url: '#' },
        { label: 'GitHub', url: '#' },
        { label: 'X / Twitter', url: '#' },
      ],
      bottomNote: 'แม่นยำ · ไม่โอ้อวด · มีรสนิยม',
    },
  )

  // --- SEOMetadata (ogImage omitted — no media seeded). TH desc = DICT foot_p TH.
  await seedGlobal(
    'seo-metadata',
    {
      title: 'Wrenfield Works — Enterprise systems, built right.',
      description:
        'AI-assisted systems, built right. The independent practice that ships like a team ten times its size.',
    },
    {
      title: 'Wrenfield Works — ระบบระดับองค์กร สร้างอย่างถูกต้อง',
      description: 'ระบบที่ใช้ AI สร้าง ทำมาอย่างถูกต้อง ทีมอิสระที่ส่งงานได้เหมือนทีมที่ใหญ่กว่าสิบเท่า',
    },
  )

  // ===========================================================================
  // COLLECTIONS
  // ===========================================================================

  // --- Stats (4; DICT stat1_k..stat4_k; counts/units mono from §3.4) ----------
  const stats: Array<{ en: Json; th: Json }> = [
    { en: { value: 60, unit: '+', label: 'Systems shipped to production' }, th: { label: 'ระบบที่ส่งขึ้น production' } },
    { en: { value: 40, unit: '%', label: 'Average review cycles cut' }, th: { label: 'ลดรอบรีวิวโดยเฉลี่ย' } },
    { en: { value: 10, unit: '×', label: 'Ship velocity vs. team size' }, th: { label: 'ความเร็วการส่งงานเทียบขนาดทีม' } },
    { en: { value: 100, unit: '%', label: 'Direct line to the builder' }, th: { label: 'คุยกับคนสร้างโดยตรง' } },
  ]
  await seedRows('stats', stats)

  // --- ClientLogos (8; mono brand names — same value both locales, §3.3/§7) ---
  const clientLogos = [
    'Northbound®',
    'Siriphan Group',
    'Halcyon Labs',
    'Meridian Freight',
    'Kasem & Co.',
    'Atlas Retail',
    'Verdant Health',
    'Rung Capital',
  ]
  await seedRows(
    'client-logos',
    clientLogos.map((name) => ({ en: { name }, th: { name } })),
  )

  // --- Capabilities (4) ------------------------------------------------------
  // categoryLabel = .cn (Automation/Tools/Systems/Leverage), icon by position.
  // title/description = DICT cap1..cap4 (&amp; rendered as &). tags = §3.5 .meta
  // rows (mono, non-localized array of { value }).
  const capabilities: Array<{ en: Json; th: Json }> = [
    {
      en: {
        categoryLabel: 'Automation',
        icon: 'automation',
        title: 'Automation & workflows',
        description:
          'Pipelines and integrations that remove manual, repetitive work — data flows, reporting, and the glue between the tools a team already runs on.',
        tags: [{ value: 'ระบบอัตโนมัติ' }, { value: '· Integrations' }, { value: '· Reporting bots' }],
      },
      th: {
        title: 'ระบบอัตโนมัติ & เวิร์กโฟลว์',
        description:
          'ไปป์ไลน์และการเชื่อมต่อที่ขจัดงานซ้ำ ๆ ที่ต้องทำมือ — การไหลของข้อมูล รายงาน และตัวเชื่อมระหว่างเครื่องมือที่ทีมใช้อยู่แล้ว',
      },
    },
    {
      en: {
        categoryLabel: 'Tools',
        icon: 'tools',
        title: 'Internal tools & dashboards',
        description:
          'Admin panels and operational tools built around how a team actually works — not generic templates bent to fit. Every control where it belongs.',
        tags: [{ value: 'เครื่องมือภายใน' }, { value: '· Dashboards' }, { value: '· Admin' }],
      },
      th: {
        title: 'เครื่องมือภายใน & แดชบอร์ด',
        description:
          'แผงควบคุมและเครื่องมือปฏิบัติการที่สร้างรอบวิธีทำงานจริงของทีม — ไม่ใช่เทมเพลตสำเร็จรูปที่ดัดให้พอใช้ ทุกการควบคุมอยู่ตรงที่ควรอยู่',
      },
    },
    {
      en: {
        categoryLabel: 'Systems',
        icon: 'systems',
        title: 'Custom platforms',
        description:
          'CRMs, booking systems, client portals, and data tools — designed, built, and deployed end to end, hardened for real users from day one.',
        tags: [{ value: 'ระบบเฉพาะทาง' }, { value: '· CRM' }, { value: '· Portals' }],
      },
      th: {
        title: 'แพลตฟอร์มเฉพาะทาง',
        description:
          'CRM ระบบจอง พอร์ทัลลูกค้า และเครื่องมือข้อมูล — ออกแบบ สร้าง และ deploy ครบวงจร แข็งแรงพร้อมผู้ใช้จริงตั้งแต่วันแรก',
      },
    },
    {
      en: {
        categoryLabel: 'Leverage',
        icon: 'leverage',
        title: 'AI-assisted delivery',
        description:
          'AI does the heavy lifting; human judgment does the rest. The result is a small operation that ships at the pace of a team ten times its size.',
        tags: [{ value: 'ใช้ AI เป็นเลเวอเรจ' }, { value: '· Quality first' }],
      },
      th: {
        title: 'ส่งมอบด้วยพลัง AI',
        description:
          'AI รับงานหนัก ส่วนวิจารณญาณคนทำที่เหลือ ผลคือทีมเล็กที่ส่งงานได้เร็วเท่าทีมที่ใหญ่กว่าสิบเท่า',
      },
    },
  ]
  await seedRows('capabilities', capabilities)

  // --- CaseStudies (3) -------------------------------------------------------
  // glyph/tag mono (§3.7). title/description = DICT case1..case3 (&amp; → &).
  // metricsLine richText = §3.7 .stat lines (mono metric values, <b> stripped) —
  // identical EN/TH so the publish gate sees both locales present.
  const caseStudies: Array<{ en: Json; th: Json }> = [
    {
      en: {
        glyph: 'C',
        tag: 'CRM · Platform',
        title: 'Enterprise CRM & portal',
        description:
          'End-to-end CRM with client portal and automated workflows, built for a team that had outgrown spreadsheets.',
        metricsLine: rt('−40% review cycles · 182 accounts live'),
      },
      th: {
        title: 'CRM & พอร์ทัลระดับองค์กร',
        description:
          'CRM ครบวงจรพร้อมพอร์ทัลลูกค้าและเวิร์กโฟลว์อัตโนมัติ สร้างให้ทีมที่โตเกินกว่าจะใช้สเปรดชีต',
        metricsLine: rt('−40% review cycles · 182 accounts live'),
      },
    },
    {
      en: {
        glyph: 'A',
        tag: 'Automation · Pipeline',
        title: 'Ops automation suite',
        description:
          'Email-to-data pipelines and reporting bots that turned hours of manual processing into a hands-off routine.',
        metricsLine: rt('~10h saved / week · 99.9% uptime'),
      },
      th: {
        title: 'ชุดระบบอัตโนมัติงานปฏิบัติการ',
        description:
          'ไปป์ไลน์แปลงอีเมลเป็นข้อมูลและบอทรายงาน ที่เปลี่ยนงานมือหลายชั่วโมงให้เป็นงานอัตโนมัติ',
        metricsLine: rt('~10h saved / week · 99.9% uptime'),
      },
    },
    {
      en: {
        glyph: 'T',
        tag: 'Tooling · Assistant',
        title: 'Internal tooling layer',
        description:
          'Estimate calculators, internal chatbots, and dashboards that put the right answer one click away for the whole team.',
        metricsLine: rt('½ onboarding time · 1-click answers'),
      },
      th: {
        title: 'เลเยอร์เครื่องมือภายใน',
        description:
          'เครื่องคิดราคา แชทบอทภายใน และแดชบอร์ด ที่ทำให้คำตอบที่ใช่อยู่ห่างทั้งทีมแค่คลิกเดียว',
        metricsLine: rt('½ onboarding time · 1-click answers'),
      },
    },
  ]
  await seedRows('case-studies', caseStudies)

  // --- ProcessSteps (3) ------------------------------------------------------
  // number mono. name = §3.8 data-t/data-th (Scope/Build/Deploy ·
  // กำหนดขอบเขต/ลงมือสร้าง/ส่งมอบ). title/description = DICT p1..p3.
  // checklist lines are English-only literals in the design (§3.8/§7) — same EN
  // text for both locales so the publish gate passes.
  const step1Checklist = [
    { point: 'Problem & constraints mapped' },
    { point: 'Concrete definition of done' },
    { point: 'Fixed scope, no surprises' },
  ]
  const step2Checklist = [
    { point: 'Weekly working builds' },
    { point: 'Quality before speed' },
    { point: 'You stay in the loop' },
  ]
  const step3Checklist = [
    { point: 'Production deploy + monitoring' },
    { point: 'Clean handover & docs' },
    { point: 'Built to survive real users' },
  ]
  const processSteps: Array<{ en: Json; th: Json }> = [
    {
      en: {
        number: '01',
        name: 'Scope',
        title: 'Define what "shipped" means',
        description:
          'Understand the real problem and the constraints before a line of code. We agree on exactly what success looks like — measurable, dated, and owned.',
        checklist: step1Checklist,
      },
      th: {
        name: 'กำหนดขอบเขต',
        title: 'นิยามว่า "เสร็จ" คืออะไร',
        description:
          'เข้าใจปัญหาจริงและข้อจำกัดก่อนเขียนโค้ดสักบรรทัด เราตกลงกันชัดว่าความสำเร็จหน้าตาเป็นอย่างไร — วัดได้ มีกำหนด และมีเจ้าของ',
        checklist: step1Checklist,
      },
    },
    {
      en: {
        number: '02',
        name: 'Build',
        title: 'AI-leveraged, production-grade',
        description:
          'Fast iterations with you in the loop throughout. AI carries the volume; judgment carries the quality. You see progress in days, not quarters.',
        checklist: step2Checklist,
      },
      th: {
        name: 'ลงมือสร้าง',
        title: 'ใช้ AI เป็นพลัง ระดับ production',
        description:
          'ทำซ้ำเร็วโดยมีคุณอยู่ในลูปตลอด AI รับปริมาณงาน วิจารณญาณคุมคุณภาพ คุณเห็นความคืบหน้าเป็นวัน ไม่ใช่ไตรมาส',
        checklist: step2Checklist,
      },
    },
    {
      en: {
        number: '03',
        name: 'Deploy',
        title: 'Ship it, hand it over clean',
        description:
          'Deploy to production, document it, and build it to last past the first real users. Your team owns the system — no lock-in, no mystery.',
        checklist: step3Checklist,
      },
      th: {
        name: 'ส่งมอบ',
        title: 'ส่ง deploy แล้วส่งมอบสะอาด',
        description:
          'Deploy ขึ้น production ทำเอกสาร และสร้างให้อยู่ทนเกินกว่าผู้ใช้จริงกลุ่มแรก ทีมคุณเป็นเจ้าของระบบ — ไม่ผูกขาด ไม่มีอะไรลึกลับ',
        checklist: step3Checklist,
      },
    },
  ]
  await seedRows('process-steps', processSteps)

  // --- ShowcaseSurfaces (3) --------------------------------------------------
  // tabName mono (§3.6 .tn). tabTitle/tabDescription = DICT sc1..sc3.
  // panel = blocks (§3.6 panels A/B/C). Block localized fields are mockRow.name
  // and kpiGrid.items.label; mono fields (sub, pillLabel, pillKind, value, chart
  // height, code text/kind) are identical both locales. The panel mock-UI copy
  // has no TH in DICT (§6.2 — decorative product chrome) → TH reuses the EN
  // localized values. The TH write must carry the WHOLE panel (the hook replaces
  // blocks arrays wholesale), so each panel is reused by reference for TH.

  // Surface A panel (automation)
  const surfaceAPanel = [
    {
      blockType: 'mockRow',
      name: 'Inbox → structured data',
      sub: 'runs every 5 min · 1,204 today',
      pillLabel: 'Healthy',
      pillKind: 'ok',
    },
    {
      blockType: 'mockRow',
      name: 'Nightly reporting export',
      sub: 'last run 02:00 · 38 reports',
      pillLabel: 'Healthy',
      pillKind: 'ok',
    },
    {
      blockType: 'mockRow',
      name: 'CRM ↔ accounting sync',
      sub: 'bi-directional · 0 conflicts',
      pillLabel: 'Running',
      pillKind: 'run',
    },
    {
      blockType: 'kpiGrid',
      items: [
        { value: '~10h', label: 'Saved / week' },
        { value: '99.9%', label: 'Uptime' },
        { value: '0', label: 'Manual touches' },
      ],
    },
  ]

  // Surface B panel (dashboard)
  const surfaceBPanel = [
    {
      blockType: 'kpiGrid',
      items: [
        { value: '฿2.4M', label: 'Pipeline value' },
        { value: '182', label: 'Active accounts' },
        { value: '+24%', label: 'QoQ growth' },
      ],
    },
    {
      blockType: 'chart',
      bars: [
        { height: 42 },
        { height: 58 },
        { height: 50 },
        { height: 74 },
        { height: 66 },
        { height: 88 },
        { height: 78 },
        { height: 100 },
      ],
    },
    {
      blockType: 'mockRow',
      name: 'Top performer · Q3',
      sub: 'Siriphan Group · 38 deals',
      pillLabel: 'On target',
      pillKind: 'ok',
    },
  ]

  // Surface C panel (deploy/code)
  const surfaceCPanel = [
    {
      blockType: 'codeLines',
      lines: [
        { text: '# deploy — idea to production', kind: 'comment' },
        { text: '$ wf ship "client-portal" --env prod', kind: 'keyword' },
        { text: '✓ tests passed · 142/142', kind: 'comment' },
        { text: '✓ migrations applied', kind: 'comment' },
        { text: '✓ handover docs generated', kind: 'comment' },
        { text: '→ live in 38s', kind: 'string' },
      ],
    },
    {
      blockType: 'mockRow',
      name: 'Shipped & handed over clean',
      sub: 'owned by your team, documented',
      pillLabel: 'Deployed',
      pillKind: 'ok',
    },
  ]

  const showcaseSurfaces: Array<{ en: Json; th: Json }> = [
    {
      en: {
        tabName: 'A · Automation',
        tabTitle: 'Hands-off pipelines',
        tabDescription: 'Email-to-data, reporting, sync',
        panel: surfaceAPanel,
      },
      th: {
        tabTitle: 'ไปป์ไลน์ที่ไม่ต้องแตะ',
        tabDescription: 'อีเมลเป็นข้อมูล รายงาน ซิงก์',
        // Mock-UI strings have no TH (§6.2) → reuse the EN panel by reference.
        panel: surfaceAPanel,
      },
    },
    {
      en: {
        tabName: 'B · Internal tools',
        tabTitle: 'Operational dashboards',
        tabDescription: 'The right answer, one click away',
        panel: surfaceBPanel,
      },
      th: {
        tabTitle: 'แดชบอร์ดปฏิบัติการ',
        tabDescription: 'คำตอบที่ใช่ ห่างแค่คลิกเดียว',
        panel: surfaceBPanel,
      },
    },
    {
      en: {
        tabName: 'C · Custom systems',
        tabTitle: 'Deployed & hardened',
        tabDescription: 'Shipped clean, built to last',
        panel: surfaceCPanel,
      },
      th: {
        tabTitle: 'Deploy แล้ว แข็งแรงพร้อมใช้',
        tabDescription: 'ส่งมอบสะอาด สร้างให้อยู่ทน',
        panel: surfaceCPanel,
      },
    },
  ]
  await seedRows('showcase-surfaces', showcaseSurfaces)

  log('seed complete ✓ (8 globals + 25 collection rows)')
}

// Top-level await so `payload run` waits for the seed to finish before exiting.
try {
  await main()
  process.exit(0)
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[seed] failed:', err)
  process.exit(1)
}
