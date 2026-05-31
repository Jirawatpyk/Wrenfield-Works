import type { GlobalConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedText, localizedRichText, monoText } from '../fields/localized'

export const CallToAction: GlobalConfig = {
  slug: 'call-to-action',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    localizedText({ name: 'kicker', required: true }),
    localizedRichText({ name: 'heading', required: true }),
    localizedText({ name: 'body', required: true }),
    { name: 'email', type: 'email', required: true },
    localizedText({ name: 'bookCallLabel', required: true }),
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        monoText({ name: 'label', required: true }),
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
