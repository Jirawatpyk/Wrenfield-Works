'use client'

import Script from 'next/script'
import { useState } from 'react'

import { INQUIRY_SUBMITTED_EVENT, trackEvent } from '@/lib/analytics'
import type { Locale } from '@/lib/i18n'
import { MAX_NAME, MAX_MESSAGE } from '@/lib/validation/inquiry'

/**
 * Inquiry form (T073, US3) — the on-site replacement for the design's `mailto:`
 * link. Posts to `/api/inquiries/submit` (the only public write path) with the visitor's
 * current locale, then shows an on-page confirmation (FR-022) and emits the
 * cookieless `inquiry_submitted` conversion (FR-011b).
 *
 * Accessibility (FR-007d, WCAG 2.1 AA):
 *   - every field has an associated <label>; errors are programmatically tied to
 *     their field via aria-invalid + aria-describedby and shown as visible text;
 *   - an assertive live region announces an error summary; a polite live region
 *     announces the success confirmation;
 *   - the submit button exposes a loading state (aria-busy, disabled) (FR-005a).
 *
 * Spam defenses pair with the server (FR-025): a hidden honeypot (`company`) and,
 * when configured, a Cloudflare Turnstile widget whose token is sent for server
 * verification. With no site key the token is empty and the server skips the
 * challenge (dev/e2e).
 *
 * Form chrome strings are bilingual literals here (not CMS content) — the same
 * pattern as LangToggle/ThemeToggle; only editorial prose lives in the CMS.
 */
type FieldKey = 'name' | 'email' | 'message' | 'consent'
type Status = 'idle' | 'sending' | 'success' | 'error'

// Bounds are imported from the server schema (single source of truth — src/lib/validation/inquiry.ts)
// so a client/server limit drift is impossible. EMAIL_RE is a lightweight client-only pre-check;
// the authoritative email validation is the server's z.email().
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const COPY: Record<
  Locale,
  {
    formLabel: string
    name: string
    email: string
    message: string
    consent: string
    privacy: string
    submit: string
    sending: string
    success: string
    summary: string
    generic: string
    fields: Record<FieldKey, string>
  }
> = {
  en: {
    formLabel: 'Project inquiry form',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    consent:
      'I agree to Wrenfield Works storing and processing my details to respond to this inquiry.',
    privacy: 'Privacy notice',
    submit: 'Send message',
    sending: 'Sending…',
    success: "Thanks — your message has been sent. We'll be in touch shortly.",
    summary: 'Please fix the highlighted fields and try again.',
    generic: 'Your message could not be sent. Please try again.',
    fields: {
      name: 'Please enter your name.',
      email: 'Please enter a valid email address.',
      message: 'Please enter a message.',
      consent: 'Please agree to the privacy notice before sending.',
    },
  },
  th: {
    formLabel: 'แบบฟอร์มติดต่อโปรเจกต์',
    name: 'ชื่อ',
    email: 'อีเมล',
    message: 'ข้อความ',
    consent: 'ฉันยินยอมให้ Wrenfield Works จัดเก็บและประมวลผลข้อมูลของฉันเพื่อตอบกลับคำขอนี้',
    privacy: 'นโยบายความเป็นส่วนตัว',
    submit: 'ส่งข้อความ',
    sending: 'กำลังส่ง…',
    success: 'ขอบคุณ — ส่งข้อความของคุณแล้ว เราจะติดต่อกลับโดยเร็ว',
    summary: 'กรุณาแก้ไขช่องที่ระบุแล้วลองใหม่อีกครั้ง',
    generic: 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง',
    fields: {
      name: 'กรุณากรอกชื่อของคุณ',
      email: 'กรุณากรอกอีเมลให้ถูกต้อง',
      message: 'กรุณากรอกข้อความ',
      consent: 'กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนส่ง',
    },
  },
}

export function InquiryForm({ locale }: { locale: Locale }) {
  const copy = COPY[locale]
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [summary, setSummary] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  function validate(values: {
    name: string
    email: string
    message: string
    consent: boolean
  }): Partial<Record<FieldKey, string>> {
    const next: Partial<Record<FieldKey, string>> = {}
    if (!values.name.trim() || values.name.trim().length > MAX_NAME) next.name = copy.fields.name
    if (!EMAIL_RE.test(values.email.trim())) next.email = copy.fields.email
    if (!values.message.trim() || values.message.trim().length > MAX_MESSAGE)
      next.message = copy.fields.message
    if (!values.consent) next.consent = copy.fields.consent
    return next
  }

  function describedBy(field: FieldKey): string | undefined {
    return errors[field] ? `inquiry-${field}-error` : undefined
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fd = new FormData(form)
    const values = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      message: String(fd.get('message') ?? ''),
      consent: fd.get('consent') === 'on',
    }

    const found = validate(values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      setSummary(copy.summary)
      setStatus('idle')
      // Move focus to the first invalid field for keyboard/SR users.
      const firstKey = (['name', 'email', 'message', 'consent'] as FieldKey[]).find((k) => found[k])
      if (firstKey) form.querySelector<HTMLElement>(`#inquiry-${firstKey}`)?.focus()
      return
    }

    setErrors({})
    setSummary('')
    setStatus('sending')

    try {
      const res = await fetch('/api/inquiries/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: values.message,
          consent: values.consent,
          locale,
          turnstileToken: String(fd.get('cf-turnstile-response') ?? ''),
          company: String(fd.get('company') ?? ''),
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
        error?: string
        errors?: Partial<Record<FieldKey, string>>
      }

      if (res.status === 201) {
        setStatus('success')
        // Fall back to a localized CONFIRMATION (never the button label) if the body lacks one.
        setSuccessMsg(json.message || copy.success)
        trackEvent(INQUIRY_SUBMITTED_EVENT, { locale })
        form.reset()
        // form.reset() clears the single-use Turnstile token; regenerate one so a
        // second submission in the same session isn't rejected as a failed challenge.
        ;(globalThis as { turnstile?: { reset?: () => void } }).turnstile?.reset?.()
        return
      }
      if (res.status === 400 && json.errors) {
        setErrors(json.errors)
        setSummary(copy.summary)
        setStatus('idle')
        return
      }
      setSummary(json.error || copy.generic)
      setStatus('error')
    } catch {
      setSummary(copy.generic)
      setStatus('error')
    }
  }

  const sending = status === 'sending'

  return (
    <form
      className="inquiry-form"
      data-testid="inquiry-form"
      aria-label={copy.formLabel}
      noValidate
      onSubmit={onSubmit}
    >
      {/* Error summary (assertive) and success confirmation (polite) live regions. */}
      {summary && status !== 'success' ? (
        <p className="form-summary form-summary-err" role="alert">
          {summary}
        </p>
      ) : null}
      {status === 'success' ? (
        <p
          className="form-summary form-summary-ok"
          role="status"
          aria-live="polite"
          data-testid="inquiry-status"
        >
          {successMsg}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="inquiry-name">{copy.name}</label>
        <input
          id="inquiry-name"
          name="name"
          type="text"
          maxLength={MAX_NAME}
          autoComplete="name"
          required
          aria-required="true"
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={describedBy('name')}
        />
        {errors.name ? (
          <p id="inquiry-name-error" className="field-err">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="inquiry-email">{copy.email}</label>
        <input
          id="inquiry-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-required="true"
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={describedBy('email')}
        />
        {errors.email ? (
          <p id="inquiry-email-error" className="field-err">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="inquiry-message">{copy.message}</label>
        <textarea
          id="inquiry-message"
          name="message"
          rows={4}
          maxLength={MAX_MESSAGE}
          required
          aria-required="true"
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={describedBy('message')}
        />
        {errors.message ? (
          <p id="inquiry-message-error" className="field-err">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people + assistive tech; bots fill it → server 429. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="inquiry-company">Company</label>
        <input id="inquiry-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field consent-row">
        <input
          id="inquiry-consent"
          name="consent"
          type="checkbox"
          required
          aria-required="true"
          aria-invalid={errors.consent ? 'true' : undefined}
          aria-describedby={describedBy('consent')}
        />
        <span className="consent-text">
          <label htmlFor="inquiry-consent">{copy.consent}</label>{' '}
          <a
            data-testid="inquiry-privacy-link"
            className="privacy-link"
            href={`/${locale}/privacy`}
          >
            {copy.privacy} ↗
          </a>
        </span>
        {errors.consent ? (
          <p id="inquiry-consent-error" className="field-err">
            {errors.consent}
          </p>
        ) : null}
      </div>

      {/* Cloudflare Turnstile — only when a site key is configured. Implicit render
          injects a hidden `cf-turnstile-response` input the submit handler reads. */}
      {siteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="lazyOnload"
          />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
        </>
      ) : null}

      <button
        type="submit"
        className="btn solid"
        data-testid="inquiry-submit"
        data-magnetic=""
        disabled={sending}
        aria-busy={sending ? 'true' : undefined}
      >
        {sending ? copy.sending : copy.submit}
        <span className="arr"> →</span>
      </button>
    </form>
  )
}
