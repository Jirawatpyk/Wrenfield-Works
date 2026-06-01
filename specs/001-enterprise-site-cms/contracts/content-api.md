# Contract: Public Content Read

Backs User Story 1 + FR-001, FR-009, FR-011a. Content is read at render time via Payload's **Local
API** (in-process) for performance; the equivalent auto-generated REST/GraphQL endpoints exist for
completeness but are not the primary public read path.

## Read semantics

- Only **published** documents are returned to the public site (drafts never leak — FR-017).
- Reads are **locale-scoped**: a request for locale `en` or `th` returns that locale's values, with
  graceful fallback to the other locale if one is unexpectedly missing (Edge Cases).
- Collections are returned **ordered** by their `order` field.

## Page composition (per locale)

A single page-data fetch returns, for the requested locale:

```jsonc
{
  "locale": "en | th",
  "nav": { "capabilities": "…", "platform": "…", "work": "…", "process": "…", "ctaLabel": "…" },
  "hero": { "kicker": "…", "headline": "<rich>", "subhead": "<rich>", "trustLabel": "…",
            "primaryCtaLabel": "…", "secondaryCtaLabel": "…" },
  "marquee": { "heading": "…", "logos": ["Northbound", "…"] },
  "stats": [ { "value": 60, "unit": "+", "label": "…" } ],
  "sectionHeadings": [ { "number": "01", "title": "<rich>", "subtitle": "…" } ],
  "capabilities": [ { "categoryLabel": "Automation", "icon": "…", "title": "…",
                      "description": "…", "tags": ["…"] } ],
  "showcase": [ { "tabName": "A · Automation", "tabTitle": "…", "tabDescription": "…",
                  "panel": [ /* blocks */ ] } ],
  "caseStudies": [ { "tag": "CRM · Platform", "glyph": "C", "title": "…",
                     "description": "…", "metricsLine": "<rich>" } ],
  "process": [ { "number": "01", "name": "…", "title": "…", "description": "…",
                 "checklist": ["…"] } ],
  "testimonial": { "quote": "<rich>", "attribution": "<rich>" },
  "cta": { "kicker": "…", "heading": "<rich>", "body": "…", "email": "…",
           "bookCallLabel": "…", "socialLinks": [ { "label": "…", "url": "…" } ] },
  "footer": { "blurb": "…", "studioLinks": [ { "label": "…", "anchor": "#…" } ],
              "connectLinks": [ { "label": "…", "url": "…" } ], "bottomNote": "…" },
  "seo": { "title": "…", "description": "…", "ogImageUrl": "https://…" }
}
```

## Empty / missing handling (Edge Cases)

- A collection with zero published items → its section is omitted/collapsed cleanly (no empty frame).
- A missing localized value at render → fall back to the other locale rather than show a blank or a
  key-like placeholder.

## Caching / freshness

- Pages are statically generated with on-demand revalidation: publishing content (FR-016) triggers
  revalidation so the change appears immediately without redeploy.
