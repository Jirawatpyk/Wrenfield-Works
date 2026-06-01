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
    localizedText({
      name: 'title',
      label: 'Title',
      required: true,
      description: {
        en: 'The case-study title shown on the Work section card.',
        th: 'ชื่อผลงานที่แสดงบนการ์ดในส่วน Work',
      },
    }),
    localizedTextarea({
      name: 'description',
      label: 'Description',
      required: true,
      description: {
        en: 'A short summary of the case study shown on its Work card.',
        th: 'คำอธิบายสั้น ๆ ของผลงานที่แสดงบนการ์ดในส่วน Work',
      },
    }),
    localizedRichText({
      name: 'metricsLine',
      label: 'Metrics line',
      description: {
        en: 'Optional results line, e.g. “+38% conversion in 6 weeks”.',
        th: 'บรรทัดผลลัพธ์ (ไม่บังคับ) เช่น “เพิ่มอัตราการแปลง 38% ใน 6 สัปดาห์”',
      },
    }),
  ],
}
