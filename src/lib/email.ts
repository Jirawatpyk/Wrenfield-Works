import { childLogger } from './logging'
import { incr } from './observability'
import type { Locale } from './i18n'

/**
 * Studio inquiry-notification email (T074, FR-029).
 *
 * `buildInquiryNotification` composes the message and is PURE. Because the name /
 * message are attacker-controlled, it HTML-escapes the html body and strips CR/LF
 * from the subject (email header-injection defense).
 *
 * `sendInquiryNotification` is FAILURE-ISOLATED: it wraps an injected transport so
 * any delivery error is logged (Pino) and surfaced as `{ sent: false }` — it NEVER
 * throws. That is what lets the inquiry write path keep the stored record even when
 * the studio email fails (Constitution V — no silent failure, failure isolation).
 * The transport is injected (the collection hook passes `req.payload.sendEmail`) so
 * this module needs no Payload/SMTP import and stays unit-testable.
 */
const log = childLogger('inquiry-email')

/** The minimal email shape Payload's `sendEmail` (Nodemailer) accepts. */
export interface EmailMessage {
  to: string
  from: string
  subject: string
  text: string
  html: string
}

/** Source data the notification is built from (a persisted inquiry). */
export interface InquiryNotificationInput {
  name: string
  email: string
  message: string
  locale: Locale
  submittedAt?: string | Date
}

/** Any transport that takes a message and resolves on accept (e.g. payload.sendEmail). */
export type EmailSender = (message: EmailMessage) => Promise<unknown> | unknown

/** Escape the five HTML-significant characters so user content can't inject markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Collapse CR/LF to spaces so a crafted name can't inject email headers. */
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export function buildInquiryNotification(
  inquiry: InquiryNotificationInput,
  opts: { to?: string; from?: string } = {},
): EmailMessage {
  const to = opts.to ?? process.env.INQUIRY_NOTIFY_TO ?? ''
  const from = opts.from ?? process.env.EMAIL_FROM ?? ''
  const submitted =
    inquiry.submittedAt instanceof Date
      ? inquiry.submittedAt.toISOString()
      : (inquiry.submittedAt ?? '')

  const subject = singleLine(`New inquiry from ${inquiry.name} (${inquiry.locale.toUpperCase()})`)

  const text = [
    `New inquiry via the website (${inquiry.locale.toUpperCase()}).`,
    '',
    `Name:    ${inquiry.name}`,
    `Email:   ${inquiry.email}`,
    `Locale:  ${inquiry.locale}`,
    submitted ? `Sent at: ${submitted}` : '',
    '',
    'Message:',
    inquiry.message,
  ]
    .filter((line) => line !== '')
    .join('\n')

  const html = `
    <h2>New inquiry via the website (${escapeHtml(inquiry.locale.toUpperCase())})</h2>
    <p><strong>Name:</strong> ${escapeHtml(inquiry.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p>
    <p><strong>Locale:</strong> ${escapeHtml(inquiry.locale)}</p>
    ${submitted ? `<p><strong>Sent at:</strong> ${escapeHtml(submitted)}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(inquiry.message)}</p>
  `.trim()

  return { to, from, subject, text, html }
}

/**
 * Best-effort studio notification. Returns `{ sent }` and NEVER throws — a transport
 * failure is logged and counted but cannot propagate into the inquiry write path
 * (FR-029). Out-of-band retry is a deployment concern; the stored inquiry is the
 * source of truth and the on-page confirmation never depends on this succeeding.
 */
export async function sendInquiryNotification(
  inquiry: InquiryNotificationInput,
  send: EmailSender,
  opts: { to?: string; from?: string } = {},
): Promise<{ sent: boolean }> {
  try {
    const message = buildInquiryNotification(inquiry, opts)
    await send(message)
    incr('inquiry.email.sent')
    return { sent: true }
  } catch (err) {
    // Swallow — the stored inquiry must survive a failed notification (FR-029).
    incr('inquiry.email.failed')
    log.error({ err }, 'inquiry notification email failed; stored inquiry retained')
    return { sent: false }
  }
}
