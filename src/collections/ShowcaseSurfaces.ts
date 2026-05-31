import type { Block, CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '../access'
import {
  localizedText,
  monoText,
  orderField,
} from '../fields/localized'
import { publishCompletenessHook } from '../lib/validation/publishCompleteness'

const mockRow: Block = {
  slug: 'mockRow',
  fields: [
    localizedText({ name: 'name', required: true }),
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
        localizedText({ name: 'label', required: true }),
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
    localizedText({ name: 'tabTitle', label: 'Tab title', required: true }),
    localizedText({ name: 'tabDescription', label: 'Tab description', required: true }),
    {
      name: 'panel',
      type: 'blocks',
      label: 'Panel content',
      blocks: [mockRow, kpiGrid, chart, codeLines],
    },
  ],
}
