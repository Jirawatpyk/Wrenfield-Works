import path from 'path'
import { fileURLToPath } from 'url'

import { withPayload } from '@payloadcms/next/withPayload'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bespoke design behavior lives in client components; keep the public bundle lean.
  reactStrictMode: true,
  // Pin the workspace root — a stray lockfile in the home dir otherwise makes
  // Next infer the wrong root (build warning).
  turbopack: {
    root: dirname,
  },
  // Media/OG images are served from in-region object storage (S3-compatible, Singapore).
  images: {
    remotePatterns: [],
  },
  // Security headers (FR-021, FR-030). HSTS enforces TLS for all in-transit data —
  // once a browser has seen it, it refuses plain HTTP to this origin. The rest are
  // baseline hardening. Applied to every route. (TLS itself is terminated in-region
  // by the platform; HSTS is the application-level guarantee that it is used.)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
