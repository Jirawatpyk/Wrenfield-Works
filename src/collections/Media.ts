import type { CollectionConfig } from 'payload'

import { anyone, isStaff } from '../access'
import { localizedText } from '../fields/localized'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    group: 'Content',
  },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  upload: true,
  fields: [localizedText({ name: 'alt', label: 'Alt text', required: true })],
}
