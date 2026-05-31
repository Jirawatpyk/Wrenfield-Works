import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import type { CollectionConfig, GlobalConfig } from 'payload'
import sharp from 'sharp'

import { conflictDetectionHook } from './lib/concurrency'
import { assertPreviewSecret, buildPreviewPath } from './lib/preview'
import {
  revalidateAfterChange,
  revalidateAfterDelete,
  revalidateGlobalAfterChange,
} from './lib/revalidate'

// Fail fast at startup if the draft-preview secret is missing/weak in production (FR-018, Security).
assertPreviewSecret()

import { Capabilities } from './collections/Capabilities'
import { CaseStudies } from './collections/CaseStudies'
import { ClientLogos } from './collections/ClientLogos'
import { Media } from './collections/Media'
import { ProcessSteps } from './collections/ProcessSteps'
import { ShowcaseSurfaces } from './collections/ShowcaseSurfaces'
import { Stats } from './collections/Stats'
import { Users } from './collections/Users'
import { CallToAction } from './globals/CallToAction'
import { Footer } from './globals/Footer'
import { Hero } from './globals/Hero'
import { Marquee } from './globals/Marquee'
import { NavLabels } from './globals/NavLabels'
import { SectionHeadings } from './globals/SectionHeadings'
import { SEOMetadata } from './globals/SEOMetadata'
import { Testimonial } from './globals/Testimonial'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * US2 cross-cutting wiring applied to every CONTENT collection/global (not Users/Media):
 *   - conflict detection (FR-020a) appended after the publish-completeness gate,
 *   - on-publish revalidation (FR-016) on change/delete,
 *   - a draft "Preview" target (FR-018) — the whole site is one page per locale.
 * Centralized here so each collection/global stays a plain content definition.
 */
const withCollectionContent = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  admin: {
    ...c.admin,
    preview:
      c.admin?.preview ?? ((_doc, ctx) => buildPreviewPath((ctx as { locale?: string })?.locale)),
  },
  hooks: {
    ...c.hooks,
    beforeValidate: [...(c.hooks?.beforeValidate ?? []), conflictDetectionHook],
    afterChange: [...(c.hooks?.afterChange ?? []), revalidateAfterChange],
    afterDelete: [...(c.hooks?.afterDelete ?? []), revalidateAfterDelete],
  },
})

const withGlobalContent = (g: GlobalConfig): GlobalConfig => ({
  ...g,
  admin: {
    ...g.admin,
    preview:
      g.admin?.preview ?? ((_doc, ctx) => buildPreviewPath((ctx as { locale?: string })?.locale)),
  },
  hooks: {
    ...g.hooks,
    beforeValidate: [...(g.hooks?.beforeValidate ?? []), conflictDetectionHook],
    afterChange: [...(g.hooks?.afterChange ?? []), revalidateGlobalAfterChange],
  },
})

/**
 * Single source of truth for the embedded Payload CMS.
 *
 * Localization is EN (default) + TH with fallback so the public read layer can
 * gracefully show the available language when one is unexpectedly missing
 * (content-api contract, spec Edge Cases). The publish-completeness gate (FR-014)
 * is wired per-collection/global via the shared `publishCompletenessHook`.
 */
export default buildConfig({
  admin: {
    user: 'users',
    // The back-office editing UI must also meet WCAG 2.1 AA (FR-007).
  },

  // EN default + TH; fallback lets a missing locale value fall back to the other.
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'ไทย', code: 'th' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },

  editor: lexicalEditor(),

  // Ordered, repeatable content + auth + media (data-model.md). Inquiries added in US3 (T070).
  // Content collections carry the US2 cross-cutting wiring; Users/Media do not.
  collections: [
    Users,
    Media,
    ...[Stats, ClientLogos, Capabilities, CaseStudies, ProcessSteps, ShowcaseSurfaces].map(
      withCollectionContent,
    ),
  ],

  // Singletons (data-model.md).
  globals: [
    Hero,
    NavLabels,
    Marquee,
    SectionHeadings,
    Testimonial,
    CallToAction,
    Footer,
    SEOMetadata,
  ].map(withGlobalContent),

  secret: process.env.PAYLOAD_SECRET || '',

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),

  // Image processing for media uploads / OG images.
  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // CORS/CSRF allow-list — deny-by-default origins for mutations (FR-021).
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(Boolean),
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(Boolean),
})
