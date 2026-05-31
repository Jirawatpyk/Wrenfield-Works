import type { Access } from 'payload'

/**
 * Access control helpers (admin-auth contract, FR-012).
 * Deny-by-default is the rule: everything requires an authenticated staff user
 * unless a rule explicitly widens it. All signed-in staff share one role with
 * full access (clarification).
 */

/** Authenticated staff only. Used for create/update/delete on managed content. */
export const isStaff: Access = ({ req }) => Boolean(req.user)

/**
 * Public reads see only published documents; authenticated staff see everything
 * (including drafts, for preview — FR-017/FR-018). Returns a query constraint
 * for the public case so drafts never leak.
 */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true
  return {
    _status: {
      equals: 'published',
    },
  }
}

/** Never allow (e.g., public create is routed only through the inquiry API). */
export const denyAll: Access = () => false

/** Always allow (e.g., referenced media assets readable by the public site). */
export const anyone: Access = () => true
