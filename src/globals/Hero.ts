import type { GlobalConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedRichText, localizedText } from '../fields/localized'

export const Hero: GlobalConfig = {
  slug: 'hero',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    localizedText({ name: 'kicker', required: true }),
    localizedRichText({ name: 'headline', required: true }),
    localizedRichText({ name: 'subhead', required: true }),
    localizedText({ name: 'trustLabel', required: true }),
    localizedText({ name: 'primaryCtaLabel', required: true }),
    localizedText({ name: 'secondaryCtaLabel', required: true }),
  ],
}
