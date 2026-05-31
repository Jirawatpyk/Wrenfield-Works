/**
 * Footer (T041) — site footer + contentinfo landmark (design-extract §3.11).
 *
 * Server component. Column headings ("Studio"/"Connect") are localized constants because the
 * Footer global has no field for them yet.
 * TODO(Phase 4): move column headings into Footer global schema.
 *
 * Renders only on `footer` content (it uses no other global), so a partial degradation of an
 * unrelated global never drops the contentinfo landmark. Link hrefs are CMS-authored and pass
 * through `safeHref` (scheme allow-list) to block javascript:/data: stored-XSS.
 */
import type { FooterVM } from '@/lib/content'
import { safeHref } from '@/lib/safeHref'

/** Brand mark — full 5-circle geometry (4 filled endpoints + hollow centre), aria-hidden. */
const MARK = (
  <svg
    className="mk"
    width="26"
    height="26"
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden
    style={{ color: 'var(--accent-deep)' }}
  >
    <polyline
      points="24,34 38,66 50,44 62,66 76,34"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="34" r="4" fill="currentColor" />
    <circle cx="38" cy="66" r="4" fill="currentColor" />
    <circle cx="50" cy="44" r="5.4" stroke="currentColor" strokeWidth="2.6" fill="none" />
    <circle cx="62" cy="66" r="4" fill="currentColor" />
    <circle cx="76" cy="34" r="4" fill="currentColor" />
  </svg>
)

const STUDIO = { en: 'Studio', th: 'สตูดิโอ' }
const CONNECT = { en: 'Connect', th: 'ติดต่อ' }

export function Footer({ footer, locale }: { footer: FooterVM; locale: 'en' | 'th' }) {
  return (
    <footer data-testid="site-footer">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            {/* `.bn` wraps the mark + wordmark (flex row) — matches the prototype so the
                `.foot-brand .bn .mk` accent + gap rules apply. */}
            <div className="bn">
              {MARK}
              Wrenfield <span className="accent">Works</span>
            </div>
            <p>{footer.blurb}</p>
          </div>
          <div className="foot-col">
            <h5>{locale === 'th' ? STUDIO.th : STUDIO.en}</h5>
            {footer.studioLinks.map((link, i) => (
              <a key={`studio-${i}`} href={safeHref(link.anchor)}>
                {link.label}
              </a>
            ))}
          </div>
          <div className="foot-col">
            <h5>{locale === 'th' ? CONNECT.th : CONNECT.en}</h5>
            {footer.connectLinks.map((link, i) => (
              <a key={`connect-${i}`} href={safeHref(link.url)}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="foot-bot">
          <span>{footer.bottomNote}</span>
        </div>
      </div>
    </footer>
  )
}
