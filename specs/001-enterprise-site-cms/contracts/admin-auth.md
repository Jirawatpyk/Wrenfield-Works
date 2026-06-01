# Contract: Back-Office Authentication & Access Control

Backs User Story 2 + FR-012, FR-013, FR-014, FR-020, FR-020a, FR-021. Provided by Payload's auth +
access-control layer.

## Authentication

- Back office (admin UI + all content/inquiry APIs) requires an authenticated `Users` session.
- **Deny by default**: any unauthenticated request to admin routes or content-mutating/ inquiry-read
  APIs is rejected and redirected to sign-in (FR-012).
- Passwords hashed (bcrypt) by Payload; sessions over TLS; CSRF protection on mutations (FR-021).
- Single role: every authenticated staff user has full access to content management and the inquiry
  inbox (clarification).

## Access rules (per resource)

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| Content collections & globals | staff | staff (admin) / public (published only) | staff | staff |
| `Inquiries` | public (via `POST /api/inquiries/submit` only; collection `create: denyAll`) | staff | staff | staff (incl. delete-on-request FR-028) |
| `Users` | staff | staff | staff (self + others) | staff |
| `Media` | staff | staff / public (referenced assets) | staff | staff |

## Publish completeness gate (FR-014)

- A `beforeChange` hook rejects a transition to `published` when any localized field is missing its
  `en` or `th` value, returning a clear, field-identifying message. Drafts may be saved incomplete.

## Concurrency conflict (FR-020a)

- On save, if the document's version/`updatedAt` no longer matches the version the editor loaded,
  the write is rejected with a "content changed since you opened it" message; no silent overwrite.

## Auditability (FR-020)

- Versions record who changed a document and when; published changes are attributable to a user.

## Inquiry inbox (FR-024)

- Authenticated staff list/read inquiries showing name, email, message, `locale`, `submittedAt`, and
  `status`; can set `status` and delete on request.
