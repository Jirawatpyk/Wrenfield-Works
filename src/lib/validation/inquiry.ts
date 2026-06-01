import { z } from 'zod'

import { type Locale, normalizeLocale } from '../i18n'

/**
 * Inquiry validation (T071, inquiry-api contract, FR-023/FR-026).
 *
 * The single server-side gate for the only public WRITE path. The schema enforces
 * the contract's bounds; `parseInquiry` runs it and returns LOCALIZED field errors
 * (FR-023) so the form can show the visitor guidance in their own language.
 *
 * Spam signals (the `company` honeypot, the Turnstile token, the per-IP rate limit)
 * are intentionally NOT 400 field errors — they are handled by the route as a spam
 * class (→ 429), so the schema treats `company`/`turnstileToken` as opaque strings.
 *
 * Pure and unit-tested (tests/unit/inquiry.spec.ts); no Payload/DB/server deps.
 */
export const MAX_NAME = 120
export const MAX_MESSAGE = 5000
export const MAX_EMAIL = 254 // RFC 5321 practical maximum

/** The validated, normalized shape the route persists. */
export interface ValidatedInquiry {
  name: string
  email: string
  message: string
  locale: Locale
  consent: true
  turnstileToken: string
  /** Honeypot — must be empty; carried through so the route can spam-check it. */
  company: string
}

export type ParseResult =
  | { success: true; data: ValidatedInquiry }
  | { success: false; errors: Record<string, string> }

/**
 * Per-field, per-locale error copy (FR-023). Keyed by the schema field name so the
 * mapper can resolve a message from an issue's path without depending on Zod's
 * internal issue codes (which differ across Zod versions).
 */
const MESSAGES: Record<Locale, Record<string, string>> = {
  en: {
    name: 'Please enter your name.',
    email: 'Please enter a valid email address.',
    message: 'Please enter a message.',
    locale: 'Unsupported language.',
    consent: 'Please agree to the privacy notice before sending.',
    form: 'Please check the form and try again.',
  },
  th: {
    name: 'กรุณากรอกชื่อของคุณ',
    email: 'กรุณากรอกอีเมลให้ถูกต้อง',
    message: 'กรุณากรอกข้อความ',
    locale: 'ไม่รองรับภาษานี้',
    consent: 'กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนส่ง',
    form: 'กรุณาตรวจสอบแบบฟอร์มแล้วลองใหม่อีกครั้ง',
  },
}

/**
 * The raw schema. `consent` MUST be the literal `true` (FR-026). `turnstileToken`
 * and `company` are optional/opaque strings here (spam handling lives in the route).
 * Strings are trimmed so " Ada " normalizes to "Ada".
 */
const inquirySchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME),
  email: z.string().trim().min(1).max(MAX_EMAIL).pipe(z.email()),
  message: z.string().trim().min(1).max(MAX_MESSAGE),
  locale: z.enum(['en', 'th']),
  consent: z.literal(true),
  turnstileToken: z.string().optional().default(''),
  company: z.string().optional().default(''),
})

/**
 * Localized route-response copy (inquiry-api contract). The visitor sees these on
 * the 201 confirmation / 429 / 500 responses in their own language (FR-022/FR-023).
 * Spam rejections reuse the generic "unavailable" copy so detection isn't revealed.
 */
export const RESPONSE_MESSAGES: Record<
  Locale,
  { confirmation: string; rateLimited: string; unavailable: string; serverError: string }
> = {
  en: {
    confirmation: "Thanks — your message has been sent. We'll be in touch shortly.",
    rateLimited: 'Too many submissions from your network. Please try again later.',
    unavailable: 'Your message could not be sent right now. Please try again later.',
    serverError: 'Something went wrong sending your message. Please try again.',
  },
  th: {
    confirmation: 'ขอบคุณ — ส่งข้อความของคุณแล้ว เราจะติดต่อกลับโดยเร็ว',
    rateLimited: 'มีการส่งจากเครือข่ายของคุณบ่อยเกินไป กรุณาลองใหม่ภายหลัง',
    unavailable: 'ขณะนี้ไม่สามารถส่งข้อความได้ กรุณาลองใหม่ภายหลัง',
    serverError: 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง',
  },
}

/** Localized response copy for a (possibly invalid) locale, EN-fallback. */
export function responseMessages(locale: Locale) {
  return RESPONSE_MESSAGES[normalizeLocale(locale)]
}

/**
 * Validate an untrusted inquiry payload. `messageLocale` selects the language of
 * the returned error copy — it is derived from the visitor's submitted locale and
 * falls back to EN if that is itself invalid (so errors are never key-like).
 */
export function parseInquiry(input: unknown, messageLocale: Locale): ParseResult {
  const dict = MESSAGES[normalizeLocale(messageLocale)]
  const result = inquirySchema.safeParse(input)

  if (result.success) {
    return { success: true, data: result.data as ValidatedInquiry }
  }

  // One localized message per offending field (first issue wins per field).
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form')
    if (!errors[field]) errors[field] = dict[field] ?? dict.form ?? 'Invalid input.'
  }
  return { success: false, errors }
}
