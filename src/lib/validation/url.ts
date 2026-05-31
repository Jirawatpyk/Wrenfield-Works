/**
 * Link-URL validation (FR-019). Editors enter link targets on the CTA social links
 * and footer connect links; the system must reject malformed input with an
 * actionable message while accepting every shape the design actually uses:
 *   - absolute http(s) URLs        e.g. https://example.com
 *   - mailto: / tel: links         e.g. mailto:hello@wrenfieldworks.com
 *   - in-page anchors              e.g. #work, or a bare '#'
 *
 * IMPORTANT: a Payload field-level custom `validate` REPLACES the built-in `text`
 * validator, so this function must also honor `required` itself — otherwise an
 * empty value on a `required: true` link field would silently pass. Payload passes
 * the field options (including `required`) as the validator's second argument.
 */
const FORMAT_ERROR =
  'Enter a valid link: an absolute URL (https://…), a mailto:/tel: link, or an in-page #anchor.'
const REQUIRED_ERROR = 'This link is required.'

export function validateLinkUrl(value: unknown, options?: { required?: boolean }): true | string {
  const isEmpty = value == null || String(value).trim() === ''
  if (isEmpty) {
    // Honor the field's own `required` (the built-in check no longer runs alongside us).
    return options?.required === true ? REQUIRED_ERROR : true
  }

  const v = String(value).trim()

  // In-page anchor: '#' or '#section-id'.
  if (v.startsWith('#')) return true

  // mailto:/tel: must carry an address/number after the scheme.
  const scheme = /^(mailto:|tel:)/i.exec(v)
  if (scheme) return v.length > scheme[0].length ? true : FORMAT_ERROR

  // Otherwise it must parse as an absolute http(s) URL with a host.
  try {
    const url = new URL(v)
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname) return true
    return FORMAT_ERROR
  } catch {
    return FORMAT_ERROR
  }
}
