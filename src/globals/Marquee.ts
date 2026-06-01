import type { GlobalConfig } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedText } from '../fields/localized'

export const Marquee: GlobalConfig = {
  slug: 'marquee',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    localizedText({
      name: 'heading',
      required: true,
      description: {
        en: 'Short phrases that scroll across the moving strip near the top of the page.',
        th: 'ข้อความสั้น ๆ ที่เลื่อนบนแถบวิ่งใกล้ด้านบนของหน้า',
      },
    }),
  ],
}
