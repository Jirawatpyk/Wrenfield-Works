import * as React from 'react'

import { BrandIcon } from './BrandIcon'

/**
 * Wrenfield Works lockup for the admin login screen (graphics.Logo, T6). The
 * wordmark is real text in the serif token (Fraunces) — selectable, crisp, and
 * theme-adaptive. Colors come from the .wf-brand-logo* classes (custom.scss), so
 * "Works" is the brass accent in both themes; no inline hex.
 */
export const BrandLogo: React.FC = () => (
  <span className="wf-brand-logo">
    <BrandIcon title="" />
    <span className="wf-brand-logo__word">
      Wrenfield <span className="wf-brand-logo__accent">Works</span>
    </span>
  </span>
)

export default BrandLogo
