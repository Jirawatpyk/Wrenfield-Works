/**
 * Bilingual custom strings for the admin back office (T3). Each entry is an
 * `{ en, th }` map, resolved with `getTranslation(entry, i18n)` from
 * `@payloadcms/translations` to the editor's chosen admin language. The unit test
 * enforces both locales (i18n gate for our own copy). `{n}`/`{total}` are simple
 * placeholders substituted at render time.
 *
 * NOT here (English-only literals per FR-011, rendered directly in components):
 * the `Published` / `Draft` status pills and the `EN` / `TH` column chips.
 */
export type Copy = { en: string; th: string }

export const adminCopy = {
  welcomeTitle: {
    en: 'Welcome to Wrenfield Works',
    th: 'ยินดีต้อนรับสู่ Wrenfield Works',
  },
  welcomeBody: {
    en: 'This is where you edit the public website — text, case studies, stats, and more.',
    th: 'นี่คือที่สำหรับแก้ไขเว็บไซต์สาธารณะ ทั้งข้อความ ผลงาน สถิติ และส่วนอื่น ๆ',
  },
  // Expectation-aligned: condition first, result second (UX S3).
  publishRule: {
    en: 'Once both English and Thai are filled in and you publish, your changes appear on the website right away. You can save an incomplete draft anytime, but publishing is blocked until both languages are complete.',
    th: 'เมื่อกรอกครบทั้งภาษาอังกฤษและภาษาไทยแล้วกดเผยแพร่ การเปลี่ยนแปลงจะแสดงบนเว็บไซต์ทันที คุณบันทึกเป็นฉบับร่างไว้ก่อนได้แม้ยังกรอกไม่ครบ แต่จะเผยแพร่ไม่ได้จนกว่าจะกรอกครบทั้งสองภาษา',
  },
  readinessTitle: {
    en: 'Publish readiness',
    th: 'ความพร้อมในการเผยแพร่',
  },
  readinessProgress: {
    en: '{n} of {total} ready to publish',
    th: 'พร้อมเผยแพร่ {n} จาก {total} รายการ',
  },
  statusReady: { en: 'Ready', th: 'พร้อม' },
  statusNotReady: { en: 'Not ready', th: 'ยังไม่พร้อม' },
  statusNotStarted: { en: 'Not started', th: 'ยังไม่เริ่ม' },
  readinessError: { en: 'Could not load', th: 'โหลดไม่สำเร็จ' },
  localeStatusTitle: {
    en: 'Saved version status',
    th: 'สถานะของฉบับที่บันทึกไว้',
  },
  // Honest about staleness (UX C1): says what it reflects and what it does not.
  localeStatusHint: {
    en: 'Shows the last saved version — not what you are typing now. Save a draft to update it.',
    th: 'แสดงสถานะของฉบับที่บันทึกล่าสุด ไม่ใช่สิ่งที่กำลังพิมพ์อยู่ตอนนี้ กดบันทึกฉบับร่างเพื่ออัปเดต',
  },
  localeStatusStale: {
    en: 'You have unsaved edits — this status does not include them yet.',
    th: 'มีการแก้ไขที่ยังไม่บันทึก สถานะนี้ยังไม่รวมการแก้ไขล่าสุด',
  },
  recheckLabel: {
    en: 'Save draft to re-check',
    th: 'บันทึกฉบับร่างเพื่อตรวจสอบใหม่',
  },
  missingEnLabel: {
    en: 'English still needed:',
    th: 'ยังขาดภาษาอังกฤษ:',
  },
  missingThLabel: {
    en: 'Thai still needed:',
    th: 'ยังขาดภาษาไทย:',
  },
} satisfies Record<string, Copy>

export type AdminCopyKey = keyof typeof adminCopy

/** Substitute `{key}` placeholders in a resolved string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}
