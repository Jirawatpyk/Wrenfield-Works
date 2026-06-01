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
    localizedText({
      name: 'title',
      required: true,
      description: {
        en: 'Shown in Google search results and the browser tab — not on the page. Aim for under 60 characters.',
        th: 'แสดงในผลค้นหา Google และแท็บเบราว์เซอร์ ไม่ได้แสดงบนหน้าเว็บ ควรไม่เกิน 60 ตัวอักษร',
      },
    }),
    localizedTextarea({
      name: 'description',
      required: true,
      description: {
        en: 'The summary under the title in search results. Aim for under 160 characters.',
        th: 'คำสรุปใต้ชื่อในผลค้นหา ควรไม่เกิน 160 ตัวอักษร',
      },
    }),
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
  ],
}
