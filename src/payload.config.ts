import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Single source of truth for the embedded Payload CMS.
 *
 * Collections / globals are registered in later foundational tasks (T011–T015).
 * Localization is EN (default) + TH with fallback so the public read layer can
 * gracefully show the available language when one is unexpectedly missing
 * (content-api contract, spec Edge Cases). The publish-completeness gate (FR-014)
 * is wired per-collection via a shared hook in `src/lib/validation`.
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

  // Users is required for the admin panel to boot; Media + ordered content
  // collections are added in Phase 2 (Foundational, T012–T013).
  collections: [Users],
  // Registered in Phase 2 (Foundational): Hero, NavLabels, Marquee, etc.
  globals: [],

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
