/**
 * URL-scheme allow-list for hrefs rendered from CMS-authored content.
 *
 * Constitution (NON-NEGOTIABLE Security): validate all external input; deny by default.
 * Rich-text links, footer studio/connect links, and CTA social links all take their href
 * verbatim from editor-controlled fields. Without this guard a stored `javascript:` /
 * `data:` / `vbscript:` URI becomes a stored-XSS vector on the public site.
 *
 * Deny-by-default: only in-page anchors (`#…`), site-relative paths (`/…`, incl.
 * protocol-relative `//…`), and the http/https/mailto/tel schemes are allowed through.
 * Anything else — including any unrecognised or dangerous scheme — collapses to `'#'`.
 * `trim()` removes leading whitespace so `"  javascript:…"` cannot smuggle a scheme past
 * the anchor; a mid-string break like `"java\nscript:"` fails the allow-list and is denied.
 */
const ALLOWED_SCHEME = /^(?:https?|mailto|tel):/i

export function safeHref(href: string | null | undefined): string {
  if (typeof href !== 'string') return '#'
  const trimmed = href.trim()
  if (!trimmed) return '#'
  // In-page anchors and (protocol-)relative paths carry no scheme — safe.
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return trimmed
  return ALLOWED_SCHEME.test(trimmed) ? trimmed : '#'
}
