import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import {
  localizedText,
  localizedTextarea,
  monoText,
  orderField,
} from '../fields/localized'

export const ProcessSteps: CollectionConfig = {
  slug: 'process-steps',
  versions: { drafts: true },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['order', 'number', 'name', 'title'],
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
    monoText({ name: 'number', label: 'Number', required: true }),
    localizedText({ name: 'name', label: 'Name', required: true }),
    localizedText({ name: 'title', label: 'Title', required: true }),
    localizedTextarea({ name: 'description', label: 'Description', required: true }),
    {
      name: 'checklist',
      type: 'array',
      label: 'Checklist',
      fields: [localizedText({ name: 'point', label: 'Point', required: true })],
    },
  ],
}
