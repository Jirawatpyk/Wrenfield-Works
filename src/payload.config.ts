import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

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
  collections: [
    Users,
    Media,
    Stats,
    ClientLogos,
    Capabilities,
    CaseStudies,
    ProcessSteps,
    ShowcaseSurfaces,
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
  ],

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
