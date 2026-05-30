import type { CollectionConfig } from 'payload'

/**
 * Back-office staff (data-model.md). Single role: every authenticated user has
 * full access to content management and the inquiry inbox (clarification).
 *
 * Phase-1 minimal shape so the admin panel can boot (Payload requires an auth
 * collection for `admin.user`). Deny-by-default access control + auth-failure
 * handling (lockout, session expiry) are added in T011 / T053–T054 (US2).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
  ],
}
