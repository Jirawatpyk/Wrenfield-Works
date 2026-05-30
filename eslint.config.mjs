import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { FlatCompat } from '@eslint/eslintrc'

const filename = fileURLToPath(import.meta.url)
const dir = dirname(filename)

const compat = new FlatCompat({ baseDirectory: dir })

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
      'docs/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]

export default eslintConfig
