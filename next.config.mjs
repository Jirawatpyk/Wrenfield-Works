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
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
