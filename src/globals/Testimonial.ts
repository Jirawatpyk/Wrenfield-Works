import type { GlobalConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedRichText } from '../fields/localized'

export const Testimonial: GlobalConfig = {
  slug: 'testimonial',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    localizedRichText({ name: 'quote', required: true }),
    localizedRichText({ name: 'attribution', required: true }),
  ],
}
