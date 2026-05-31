import type { GlobalConfig } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedText, localizedRichText, monoText } from '../fields/localized'

export const SectionHeadings: GlobalConfig = {
  slug: 'section-headings',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    {
      name: 'headings',
      type: 'array',
      minRows: 4,
      maxRows: 4,
      fields: [
        monoText({ name: 'number', required: true }),
        localizedRichText({ name: 'title', required: true }),
        localizedText({ name: 'subtitle', required: true }),
      ],
    },
  ],
}
