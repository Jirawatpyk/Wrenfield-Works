import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { th } from '@payloadcms/translations/languages/th'
import { buildConfig } from 'payload'
import type { CollectionConfig, Field, GlobalConfig } from 'payload'
import sharp from 'sharp'

import { conflictDetectionHook } from './lib/concurrency'
import { envInt } from './lib/env'
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
import { Inquiries } from './collections/Inquiries'
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
 * In-region (Singapore) object storage for media / OG images (T077, FR-030). Enabled
 * ONLY when an S3 bucket is configured; otherwise media falls back to Payload's local
 * disk upload (dev/test) so neither needs cloud credentials. Region defaults to
 * `ap-southeast-1` for PDPA data residency.
 */
/** Extract a bare email address from EMAIL_FROM (`"Name <addr>"` or `"addr"`); '' if none. */
function emailFromAddress(): string {
  const raw = (process.env.EMAIL_FROM || '').trim()
  const angle = /<([^>]+)>/.exec(raw)
  if (angle?.[1]) return angle[1].trim()
  // Accept ONLY a clean bare address (one token, single @, no spaces/commas/brackets);
  // an unclosed-angle (`Name <a@x`) or comma-list value falls back rather than becoming
  // an invalid From header.
  return /^[^\s,<>]+@[^\s,<>]+$/.test(raw) ? raw : ''
}

/**
 * Studio email transport (T074, FR-029). Wired ONLY when SMTP is configured; without
 * it Payload falls back to its console transport (dev/test) — so an unconfigured deploy
 * is visible (no real delivery) rather than silently pretending to send. The inquiry
 * `from`/`to` are set per-message in src/lib/email.ts; these are just defaults.
 */
const SMTP_PORT = envInt('SMTP_PORT', 587, 1)
// TLS mode: implicit TLS on 465, STARTTLS elsewhere — overridable via SMTP_SECURE=true|false
// for a provider using implicit TLS on a non-465 port (nodemailer does not infer this).
const SMTP_SECURE =
  process.env.SMTP_SECURE === 'true'
    ? true
    : process.env.SMTP_SECURE === 'false'
      ? false
      : SMTP_PORT === 465
const emailAdapter = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromName: 'Wrenfield Works',
      // Derive the sender from EMAIL_FROM — NOT SMTP_USER, which is often a non-email
      // login (e.g. SendGrid 'apikey', SES IAM username) and would be an invalid From.
      defaultFromAddress: emailFromAddress() || 'no-reply@wrenfieldworks.com',
      // Don't block a cold start on a live SMTP handshake (the "usable within 3s" budget);
      // a misconfigured transport surfaces per-send (failure-isolated) instead.
      skipVerify: true,
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      },
    })
  : undefined

const storagePlugins = process.env.S3_BUCKET
  ? [
      s3Storage({
        collections: { media: true },
        bucket: process.env.S3_BUCKET,
        config: {
          region: process.env.S3_REGION || 'ap-southeast-1',
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          },
          // Custom S3-compatible endpoint (e.g. self-hosted MinIO) uses path-style URLs.
          ...(process.env.S3_ENDPOINT
            ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
            : {}),
        },
      }),
    ]
  : []

/**
 * Per-document EN/TH status banner (T10). A presentation-only `ui` field rendered
 * at the top of every content edit view. It holds no data (skipped by the
 * completeness walker and by `generate:types`), so the DB schema and the publish
 * gate are unchanged. Prepended to each content type's `fields` via the wrappers
 * below. Path uses the `@/*` alias (same rationale as the `admin.components` paths).
 */
// Factory (NOT a shared constant): Payload mutates field objects in place during
// config sanitization, so each entity needs its own fresh object.
//
// The field's identity is baked in via `serverProps`: Payload's field
// server-component props expose `collectionSlug` but NOT `globalSlug` (see
// renderField.js / ServerComponentProps), so a component cannot discover which
// GLOBAL it belongs to at render time. We pass `{ contentSlug, contentKind }`
// explicitly through the object-form component (`{ path, exportName, serverProps }`,
// which `RenderServerComponent` spreads into the RSC) so the banner knows its own
// document on both collections and globals. The import-map key stays
// `…/LocaleStatusField#default`, unchanged from the string form.
const makeLocaleStatusField = (contentSlug: string, contentKind: 'collection' | 'global') =>
  ({
    name: 'localeStatus',
    type: 'ui' as const,
    admin: {
      components: {
        Field: {
          path: '@/components/admin/LocaleStatusField',
          exportName: 'default',
          serverProps: { contentSlug, contentKind },
        },
      },
    },
  }) satisfies Field

/**
 * US2 cross-cutting wiring applied to every CONTENT collection/global (not Users/Media):
 *   - conflict detection (FR-020a) appended after the publish-completeness gate,
 *   - on-publish revalidation (FR-016) on change/delete,
 *   - a draft "Preview" target (FR-018) — the whole site is one page per locale.
 * Centralized here so each collection/global stays a plain content definition.
 */
const withCollectionContent = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  // Per-document EN/TH status banner shown first on every content edit view (T10).
  fields: [makeLocaleStatusField(c.slug, 'collection'), ...c.fields],
  // Open-time concurrent-edit guard (FR-020a, defense-in-depth alongside the optimistic
  // save-time check in src/lib/concurrency.ts): Payload warns when another editor holds the doc.
  lockDocuments: c.lockDocuments ?? { duration: 300 },
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
  // Per-document EN/TH status banner shown first on every content edit view (T10).
  fields: [makeLocaleStatusField(g.slug, 'global'), ...g.fields],
  // Open-time concurrent-edit guard (FR-020a, defense-in-depth — see the collection wrapper).
  lockDocuments: g.lockDocuments ?? { duration: 300 },
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
    // Ship both themes (dark + light) with the switcher in account settings.
    // `theme: 'all'` lets each editor's choice — and, until they choose, their OS
    // `prefers-color-scheme` — drive the admin theme (Payload's standard behavior).
    // (We dropped a custom "force dark on first visit" provider: Payload's own
    // ThemeProvider re-asserts the OS preference on mount, so any external nudge
    // is overridden — fighting it isn't worth the fragility. Both themes are AA.)
    theme: 'all',
    // The back-office editing UI must also meet WCAG 2.1 AA (FR-007).
    components: {
      // Use the `@/*` tsconfig alias (-> ./src/*) rather than a leading-slash
      // path: Payload resolves leading-slash paths relative to importMap.baseDir
      // (defaults to repo ROOT, not src/), so a `/components/...` path would emit
      // `../../../../components/...` and miss our src/ tree. The alias is written
      // verbatim and resolved by Next, matching how src/lib is imported elsewhere.
      graphics: {
        Logo: '@/components/admin/BrandLogo#BrandLogo',
        Icon: '@/components/admin/BrandIcon#BrandIcon',
      },
      // Dashboard editor guidance (T9): bilingual welcome card + EN/TH publish-
      // readiness panel. Server components — Payload injects `payload` + `i18n`.
      // Use the `@/*` alias (same rationale as `graphics` above).
      beforeDashboard: [
        '@/components/admin/WelcomeCard#default',
        '@/components/admin/PublishReadiness#default',
      ],
    },
    meta: {
      titleSuffix: ' — Wrenfield Works',
      description: 'Wrenfield Works content management',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
    },
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

  // Bilingual back office: Payload chrome in EN + TH; editors pick their admin
  // language in account settings. EN is the fallback. (Content EN/TH is the
  // separate `localization` config above.)
  i18n: {
    supportedLanguages: { en, th },
    fallbackLanguage: 'en',
  },

  editor: lexicalEditor(),

  // Ordered, repeatable content + auth + media (data-model.md).
  // Content collections carry the US2 cross-cutting wiring; Users/Media/Inquiries do not
  // (Inquiries is single-locale personal data, not bilingual published content — US3, T070).
  collections: [
    Users,
    Media,
    Inquiries,
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

  // Studio inquiry-notification transport when SMTP is configured (T074, FR-029).
  ...(emailAdapter ? { email: emailAdapter } : {}),

  // In-region media storage (S3, ap-southeast-1) when configured (T077, FR-030).
  plugins: storagePlugins,

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      // Force verified TLS for any non-local DB (managed Postgres like Neon) regardless of
      // whether the connection string carries `sslmode=require` — without this, a URL missing
      // sslmode connects insecurely and the server rejects it ("connection is insecure").
      // Local docker Postgres (localhost/127.0.0.1) uses no TLS.
      ...(/@(?:localhost|127\.0\.0\.1|\[?::1\]?)(?::|\/)/.test(process.env.DATABASE_URI || '')
        ? {}
        : { ssl: true }),
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
