import type { CollectionConfig } from 'payload'

import { isStaff } from '../access'

/**
 * Back-office staff (data-model.md, T011). Single role: every authenticated user
 * has full access to content management and the inquiry inbox (clarification).
 *
 * Deny-by-default access (FR-012, admin-auth contract): all operations require an
 * authenticated staff user. Auth-failure handling (lockout, session expiry) and
 * the create-first-user bootstrap are refined in US2 (T053–T054).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Lock out repeated failed sign-ins; expire idle sessions (FR-021a).
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes
    tokenExpiration: 2 * 60 * 60, // 2 hours
  },
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
    // Admin-panel access is boolean-only (no query constraint): authenticated staff.
    admin: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
  ],
}
