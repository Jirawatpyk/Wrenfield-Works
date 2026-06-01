import type { GlobalConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'
import { localizedRichText } from '../fields/localized'

export const Testimonial: GlobalConfig = {
  slug: 'testimonial',
  versions: { drafts: true },
  admin: { group: 'Site Content' },
  access: { read: publishedOrStaff, update: isStaff },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    localizedRichText({
      name: 'quote',
      required: true,
      description: {
        en: 'The testimonial quote. The quotation marks are added automatically.',
        th: 'ข้อความรับรอง ระบบจะใส่เครื่องหมายคำพูดให้อัตโนมัติ',
      },
    }),
    localizedRichText({
      name: 'attribution',
      required: true,
      description: {
        en: 'Person’s name and role, e.g. “Head of Product”.',
        th: 'ชื่อและตำแหน่งของบุคคล เช่น “หัวหน้าฝ่ายผลิตภัณฑ์”',
      },
    }),
  ],
}
