import type { GlobalConfig } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedText, localizedTextarea } from '../fields/localized'

export const SEOMetadata: GlobalConfig = {
  slug: 'seo-metadata',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    localizedText({ name: 'title', required: true }),
    localizedTextarea({ name: 'description', required: true }),
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
  ],
}
