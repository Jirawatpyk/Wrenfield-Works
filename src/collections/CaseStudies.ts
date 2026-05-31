import type { CollectionConfig } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import {
  localizedText,
  localizedTextarea,
  localizedRichText,
  monoText,
  orderField,
} from '../fields/localized'

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  versions: { drafts: true },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['order', 'tag', 'title'],
    group: 'Content',
  },
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  hooks: {
    beforeValidate: [publishCompletenessHook],
  },
  fields: [
    orderField,
    monoText({ name: 'tag', label: 'Tag', required: true }),
    monoText({ name: 'glyph', label: 'Glyph', required: true }),
    localizedText({ name: 'title', label: 'Title', required: true }),
    localizedTextarea({ name: 'description', label: 'Description', required: true }),
    localizedRichText({ name: 'metricsLine', label: 'Metrics line' }),
  ],
}
