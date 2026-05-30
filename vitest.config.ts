import path from 'path'
import { fileURLToPath } from 'url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.spec.{ts,tsx}', 'tests/integration/**/*.spec.{ts,tsx}'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      // Constitution test gate: ≥80% on business-logic modules.
      include: [
        'src/lib/**',
        'src/collections/**',
        'src/globals/**',
        'src/access/**',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(dir, 'src'),
      '@payload-config': path.resolve(dir, 'src/payload.config.ts'),
    },
  },
})
