import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedText, monoText, orderField } from '../fields/localized'

export const Stats: CollectionConfig = {
  slug: 'stats',
  versions: {
    drafts: true,
  },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['order', 'value', 'unit', 'label'],
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
    {
      name: 'value',
      type: 'number',
      required: true,
      admin: {
        description: 'Numeric value, e.g. 60, 40, 100. Validated as a number (FR-019).',
      },
    },
    monoText({ name: 'unit', label: 'Unit', required: true }),
    localizedText({ name: 'label', label: 'Label', required: true }),
  ],
}
