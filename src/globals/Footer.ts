import type { GlobalConfig } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedText, monoText } from '../fields/localized'

export const Footer: GlobalConfig = {
  slug: 'footer',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    localizedText({ name: 'blurb', required: true }),
    {
      name: 'studioLinks',
      type: 'array',
      fields: [
        localizedText({ name: 'label', required: true }),
        { name: 'anchor', type: 'text', required: true },
      ],
    },
    {
      name: 'connectLinks',
      type: 'array',
      fields: [
        monoText({ name: 'label', required: true }),
        { name: 'url', type: 'text', required: true },
      ],
    },
    localizedText({ name: 'bottomNote', required: true }),
  ],
}
