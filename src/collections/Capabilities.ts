import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import {
  localizedText,
  localizedTextarea,
  monoText,
  orderField,
} from '../fields/localized'

export const Capabilities: CollectionConfig = {
  slug: 'capabilities',
  versions: { drafts: true },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['order', 'categoryLabel', 'title'],
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
    monoText({ name: 'categoryLabel', label: 'Category label', required: true }),
    {
      name: 'icon',
      type: 'select',
      required: true,
      options: [
        { label: 'Automation', value: 'automation' },
        { label: 'Tools', value: 'tools' },
        { label: 'Systems', value: 'systems' },
        { label: 'Leverage', value: 'leverage' },
      ],
    },
    localizedText({ name: 'title', label: 'Title', required: true }),
    localizedTextarea({ name: 'description', label: 'Description', required: true }),
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
  ],
}
