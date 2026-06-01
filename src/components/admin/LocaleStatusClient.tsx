'use client'

import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import { useFormModified, useTranslation } from '@payloadcms/ui'
import * as React from 'react'

import { adminCopy } from '@/lib/admin/adminCopy'

/**
 * Client wrapper for the per-document status banner (T10). The server renders the
 * saved-state status (children); this layer watches the form's modified flag and,
 * when the editor has unsaved edits, shows an honest "this status doesn't include
 * your latest edits yet" warning + the save-draft re-check hint. It does NOT
 * recompute status on the client (the edit form holds only the active locale).
 */
export const LocaleStatusClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modified = useFormModified()
  const { i18n } = useTranslation()
  return (
    <div className="wf-locale-status" data-testid="wf-locale-status">
      {children}
      <span className="wf-locale-status__hint">
        {getTranslation(adminCopy.localeStatusHint, i18n as unknown as I18nClient)}
      </span>
      {modified ? (
        <p className="wf-locale-status__stale" role="status">
          {getTranslation(adminCopy.localeStatusStale, i18n as unknown as I18nClient)}{' '}
          {getTranslation(adminCopy.recheckLabel, i18n as unknown as I18nClient)}
        </p>
      ) : null}
    </div>
  )
}

export default LocaleStatusClient
