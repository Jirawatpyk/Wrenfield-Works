import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import * as React from 'react'

import { adminCopy } from '@/lib/admin/adminCopy'

/**
 * Dashboard welcome card (beforeDashboard, T9). Server component: receives the
 * admin `i18n` so copy renders in the editor's chosen language. States what the
 * CMS edits and the publish rule (both EN + TH required, FR-014).
 */
const WelcomeCard: React.FC<{ i18n: I18nClient }> = ({ i18n }) => (
  <section data-testid="wf-welcome-card" className="wf-card">
    <h2 style={{ margin: '0 0 8px' }}>{getTranslation(adminCopy.welcomeTitle, i18n)}</h2>
    <p className="wf-card__body">{getTranslation(adminCopy.welcomeBody, i18n)}</p>
    <p className="wf-card__rule">
      <strong>{getTranslation(adminCopy.publishRule, i18n)}</strong>
    </p>
  </section>
)

export default WelcomeCard
