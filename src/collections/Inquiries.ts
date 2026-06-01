import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { denyAll, isStaff } from '../access'
import { sendInquiryNotification } from '../lib/email'
import type { Locale } from '../lib/i18n'
import { childLogger } from '../lib/logging'
import { incr } from '../lib/observability'

const emailLog = childLogger('inquiry-email')

/**
 * Inquiries (T070, T075, data-model.md — PERSONAL DATA / PDPA).
 *
 * The store behind the only public WRITE path and the back-office inbox (FR-024).
 * Deny-by-default and personal-data-aware:
 *   - create = denyAll: the public submission route (src/app/api/inquiries) creates
 *     with `overrideAccess` AFTER Zod validation + spam checks, so the generic REST
 *     create is closed to everyone (FR-012, FR-025).
 *   - read/update/delete = staff only (the inbox + delete-on-request, FR-028).
 *   - NO drafts/versions: retaining version history of personal data would defeat
 *     the FR-027 "permanent deletion at 24 months" guarantee.
 *
 * Submitted fields are admin-readOnly (an inquiry is a record of what was sent);
 * only `status` is editable for triage. A best-effort `afterChange` notification
 * emails the studio on create — failure-isolated so it can never lose the record
 * (FR-029, src/lib/email.ts).
 */

/** Best-effort studio notification on a NEW inquiry (FR-029). Never throws / never blocks the write. */
const notifyStudioOnCreate: CollectionAfterChangeHook = ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  // With no SMTP transport configured, Payload's default sendEmail only logs and RESOLVES —
  // which would falsely increment inquiry.email.sent. Mark it unconfigured and skip so
  // monitoring reflects reality (the stored inquiry is unaffected — FR-029).
  if (!process.env.SMTP_HOST) {
    incr('inquiry.email.unconfigured')
    emailLog.warn('inquiry notification skipped: no SMTP transport configured (set SMTP_HOST)')
    return doc
  }
  const inquiry = doc as {
    name: string
    email: string
    message: string
    locale: Locale
    createdAt?: string
  }
  // Fire-and-forget: the send is internally failure-isolated (returns {sent:false} on
  // error, never rejects) so it cannot fail the request or blow the latency budget.
  void sendInquiryNotification(
    {
      name: inquiry.name,
      email: inquiry.email,
      message: inquiry.message,
      locale: inquiry.locale,
      submittedAt: inquiry.createdAt,
    },
    (message) => req.payload.sendEmail(message),
  ).catch(() => {
    /* sendInquiryNotification never rejects; this is belt-and-suspenders. */
  })
  return doc
}

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  // No drafts/versions — see PDPA note above.
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'locale', 'status', 'createdAt'],
    group: 'Inbox',
    // Newest first so staff see fresh inquiries at the top of the inbox.
    listSearchableFields: ['name', 'email', 'message'],
    description:
      'Inquiries submitted from the public site. Personal data — auto-deleted 24 months after submission (PDPA, FR-027). Use “Delete” to honor an erasure request (FR-028).',
  },
  defaultSort: '-createdAt',
  access: {
    create: denyAll, // public create only via the validated /api/inquiries route (overrideAccess)
    read: isStaff,
    update: isStaff,
    delete: isStaff, // delete-on-request (FR-028)
  },
  hooks: {
    afterChange: [notifyStudioOnCreate],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: [
        { label: 'English', value: 'en' },
        { label: 'ไทย', value: 'th' },
      ],
      admin: { readOnly: true, description: 'Language the visitor was using (FR-024).' },
    },
    {
      name: 'consent',
      type: 'checkbox',
      required: true,
      admin: { readOnly: true, description: 'Visitor agreed to data processing (FR-026).' },
    },
    {
      name: 'consentAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'When consent was given (server-set).',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      index: true, // retention job queries this (data-model.md)
      admin: {
        readOnly: true,
        description: 'Auto-deletion date = submitted + 24 months (FR-027).',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      index: true, // inbox filter (data-model.md)
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { description: 'Inbox triage state.' },
    },
  ],
}
