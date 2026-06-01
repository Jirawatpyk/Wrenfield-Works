import type { Block, CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import { localizedText, monoText, orderField } from '../fields/localized'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'

const mockRow: Block = {
  slug: 'mockRow',
  fields: [
    localizedText({
      name: 'name',
      required: true,
      description: {
        en: 'The row’s display name in this mock interface.',
        th: 'ชื่อที่แสดงของแถวนี้ในหน้าจอจำลอง',
      },
    }),
    monoText({ name: 'sub' }),
    monoText({ name: 'pillLabel' }),
    {
      name: 'pillKind',
      type: 'select',
      options: [
        { label: 'OK', value: 'ok' },
        { label: 'Running', value: 'run' },
      ],
    },
  ],
}

const kpiGrid: Block = {
  slug: 'kpiGrid',
  fields: [
    {
      name: 'items',
      type: 'array',
      fields: [
        monoText({ name: 'value', required: true }),
        localizedText({
          name: 'label',
          required: true,
          description: {
            en: 'The caption under this KPI’s value.',
            th: 'คำบรรยายใต้ค่าตัวเลขของ KPI นี้',
          },
        }),
      ],
    },
  ],
}

const chart: Block = {
  slug: 'chart',
  fields: [
    {
      name: 'bars',
      type: 'array',
      fields: [{ name: 'height', type: 'number', required: true, min: 0, max: 100 }],
    },
  ],
}

const codeLines: Block = {
  slug: 'codeLines',
  fields: [
    {
      name: 'lines',
      type: 'array',
      fields: [
        monoText({ name: 'text', required: true }),
        {
          name: 'kind',
          type: 'select',
          options: [
            { label: 'Comment', value: 'comment' },
            { label: 'Keyword', value: 'keyword' },
            { label: 'String', value: 'string' },
            { label: 'Plain', value: 'plain' },
          ],
        },
      ],
    },
  ],
}

export const ShowcaseSurfaces: CollectionConfig = {
  slug: 'showcase-surfaces',
  versions: { drafts: true },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'tabTitle',
    defaultColumns: ['order', 'tabName', 'tabTitle'],
    group: 'Content',
  },
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  hooks: { beforeValidate: [publishCompletenessHook] },
  fields: [
    orderField,
    monoText({ name: 'tabName', label: 'Tab name', required: true }),
    localizedText({
      name: 'tabTitle',
      label: 'Tab title',
      required: true,
      description: {
        en: 'The tab label for this showcase surface.',
        th: 'ป้ายแท็บของพื้นผิวโชว์เคสนี้',
      },
    }),
    localizedText({
      name: 'tabDescription',
      label: 'Tab description',
      required: true,
      description: {
        en: 'The short description shown when this showcase tab is open.',
        th: 'คำอธิบายสั้น ๆ ที่แสดงเมื่อเปิดแท็บโชว์เคสนี้',
      },
    }),
    {
      name: 'panel',
      type: 'blocks',
      label: 'Panel content',
      blocks: [mockRow, kpiGrid, chart, codeLines],
    },
  ],
}
