import type { GlobalConfig } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedText, localizedRichText, monoText } from '../fields/localized'

export const SectionHeadings: GlobalConfig = {
  slug: 'section-headings',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    {
      name: 'headings',
      type: 'array',
      minRows: 4,
      maxRows: 4,
      fields: [
        monoText({ name: 'number', required: true }),
        localizedRichText({
          name: 'title',
          required: true,
          description: {
            en: 'The heading shown at the top of this section on the public page.',
            th: 'หัวข้อที่แสดงด้านบนของส่วนนี้บนหน้าเว็บสาธารณะ',
          },
        }),
        localizedText({
          name: 'subtitle',
          required: true,
          description: {
            en: 'The supporting line shown under this section’s heading.',
            th: 'ข้อความรองที่แสดงใต้หัวข้อของส่วนนี้',
          },
        }),
      ],
    },
  ],
}
