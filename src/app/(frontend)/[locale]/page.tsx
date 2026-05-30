/**
 * Phase-1 placeholder for the public home page. The full faithful composition of
 * all design sections from published CMS content is built in User Story 1 (T042).
 * This stub only verifies locale routing and theming boot correctly.
 */
const COPY = {
  en: { kicker: 'AI-assisted systems, built right.', body: 'Public site scaffolding is in place.' },
  th: { kicker: 'ระบบที่ใช้ AI ช่วย สร้างอย่างถูกต้อง', body: 'โครงเว็บสาธารณะพร้อมแล้ว' },
} as const

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const copy = locale === 'th' ? COPY.th : COPY.en

  return (
    <main className="wrap" style={{ paddingBlock: 'var(--s-section)' }}>
      <p className="kicker" style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
        {copy.kicker}
      </p>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px,7vw,86px)', lineHeight: 1.04 }}>
        Wrenfield <span style={{ color: 'var(--accent-deep)' }}>Works</span>
      </h1>
      <p style={{ color: 'var(--fg2)', marginTop: 16 }}>{copy.body}</p>
    </main>
  )
}
