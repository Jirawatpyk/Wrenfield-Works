import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { monoText, orderField } from '../fields/localized'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'

export const ClientLogos: CollectionConfig = {
  slug: 'client-logos',
  versions: { drafts: true },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['order', 'name'],
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
  fields: [orderField, monoText({ name: 'name', label: 'Client name', required: true })],
}
