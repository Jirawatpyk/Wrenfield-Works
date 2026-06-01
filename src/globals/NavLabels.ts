import type { GlobalConfig } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedText } from '../fields/localized'

export const NavLabels: GlobalConfig = {
  slug: 'nav-labels',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    localizedText({ name: 'capabilities', required: true }),
    localizedText({ name: 'platform', required: true }),
    localizedText({ name: 'work', required: true }),
    localizedText({ name: 'process', required: true }),
    localizedText({ name: 'ctaLabel', required: true }),
  ],
}
