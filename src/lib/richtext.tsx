/**
 * Minimal Lexical rich-text serializer for the public site.
 *
 * Payload stores hero headline/subhead, testimonial quote/attribution, the CTA heading,
 * section titles, and case-study metrics lines as Lexical JSON with inline emphasis
 * (`<em>` / `<b>`). The design renders some of these *inline* inside a heading/blockquote,
 * so a block-level renderer (`<p>` wrapper) is not enough. `RichInline` flattens paragraphs
 * to inline content; `RichText` renders block paragraphs. Both are pure server components.
 */
import { Fragment, type ReactNode } from 'react'

import type { RichTextValue } from './content'
import { safeHref } from './safeHref'

// Lexical TextNode format bitmask.
const IS_BOLD = 1
const IS_ITALIC = 2
const IS_STRIKETHROUGH = 4
const IS_UNDERLINE = 8
const IS_CODE = 16

type LexNode = {
  type?: string
  text?: string
  format?: number | string
  tag?: string
  url?: string
  fields?: { url?: string; newTab?: boolean }
  children?: LexNode[]
}

function rootChildren(value: RichTextValue | undefined): LexNode[] {
  const root = value && typeof value === 'object' ? (value as { root?: LexNode }).root : undefined
  return Array.isArray(root?.children) ? (root!.children as LexNode[]) : []
}

/**
 * Wrap text in <strong>/<em>/<code>/... according to the Lexical format bitmask.
 * Each wrapper is a single (non-array) child of the next, so no `key` is needed — the
 * list-level key is supplied once by the caller's <Fragment>.
 */
function formatText(text: string, format: number): ReactNode {
  let node: ReactNode = text
  if (format & IS_CODE) node = <code>{node}</code>
  if (format & IS_BOLD) node = <strong>{node}</strong>
  if (format & IS_ITALIC) node = <em>{node}</em>
  if (format & IS_UNDERLINE) node = <u>{node}</u>
  if (format & IS_STRIKETHROUGH) node = <s>{node}</s>
  return node
}

/** Render inline children (text, linebreak, link, nested) of a node. */
function renderInline(children: LexNode[] | undefined, keyPrefix: string): ReactNode[] {
  if (!children) return []
  return children.map((child, i) => {
    const key = `${keyPrefix}-${i}`
    if (child.type === 'linebreak') return <br key={key} />
    if (typeof child.text === 'string') {
      const format = typeof child.format === 'number' ? child.format : 0
      return <Fragment key={key}>{formatText(child.text, format)}</Fragment>
    }
    if (child.type === 'link') {
      // href is CMS-authored — scheme-allow-list it to block javascript:/data: XSS.
      const href = safeHref(child.fields?.url ?? child.url)
      const external = child.fields?.newTab
      return (
        <a
          key={key}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {renderInline(child.children, key)}
        </a>
      )
    }
    return <Fragment key={key}>{renderInline(child.children, key)}</Fragment>
  })
}

/** Flatten all paragraphs to inline content (no block wrappers). Use inside a heading/quote. */
export function RichInline({ value }: { value: RichTextValue | undefined }): ReactNode {
  const blocks = rootChildren(value)
  return (
    <>
      {blocks.map((block, i) => (
        <Fragment key={`b-${i}`}>
          {i > 0 ? ' ' : null}
          {renderInline(block.children, `b-${i}`)}
        </Fragment>
      ))}
    </>
  )
}

/** Render block paragraphs as <p>. Use for multi-paragraph prose. */
export function RichText({ value }: { value: RichTextValue | undefined }): ReactNode {
  const blocks = rootChildren(value)
  return (
    <>
      {blocks.map((block, i) => (
        <p key={`p-${i}`}>{renderInline(block.children, `p-${i}`)}</p>
      ))}
    </>
  )
}
