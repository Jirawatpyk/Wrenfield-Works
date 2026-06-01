import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier'

/**
 * ESLint flat config (ESLint 9 + Next 16).
 *
 * Imports `eslint-config-next`'s NATIVE flat-config export directly, NOT
 * `FlatCompat.extends('next/...')`. FlatCompat routes the legacy preset through
 * `@eslint/eslintrc`'s schema validator, which deep-JSON-stringifies the resolved config and
 * crashes on `eslint-plugin-react`'s self-referential flat config:
 *   "Converting circular structure to JSON … 'react' closes the circle".
 * That made `pnpm lint` unrunnable. ESLint 9's native flat engine consumes the array directly
 * (no JSON.stringify), so the import path below avoids the crash.
 *
 * `eslint-config-next/core-web-vitals` is a 4-element flat array that already bundles the
 * react / react-hooks / import / jsx-a11y / @next/next plugins AND `next/typescript`
 * (typescript-eslint), so it is the whole preset — nothing else needs re-adding.
 * `eslint-config-prettier` is applied last so Prettier owns formatting (run via `prettier --check`).
 */
const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
      'docs/**',
    ],
  },
  ...nextCoreWebVitals,
  prettier,
]

export default eslintConfig
