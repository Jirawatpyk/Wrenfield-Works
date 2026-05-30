# Contract: Public Inquiry Submission API

The only public **write** surface. Backs User Story 3 and FR-022–029.

## Endpoint

`POST /api/inquiries`

- Content-Type: `application/json`
- Public (no auth). Protected by Turnstile token + honeypot + per-IP rate limit.

### Request body

```json
{
  "name": "string (1..120, required)",
  "email": "string (valid email, required)",
  "message": "string (1..5000, required)",
  "locale": "en | th (required — language the visitor was using)",
  "consent": "boolean (MUST be true)",
  "turnstileToken": "string (required)",
  "company": "string (HONEYPOT — must be empty/absent)"
}
```

### Validation (server, Zod)

- `name`, `email`, `message` present and within bounds; `email` well-formed.
- `consent === true` (FR-026) — otherwise reject.
- `turnstileToken` verified server-side; `company` honeypot must be empty (FR-025).
- Rate limit per IP; exceeded → `429`.

### Responses

| Status | Meaning | Body |
|--------|---------|------|
| `201 Created` | Inquiry stored; confirmation to show visitor (FR-022) | `{ "ok": true, "message": "<localized confirmation>" }` |
| `400 Bad Request` | Validation failed | `{ "ok": false, "errors": { "<field>": "<localized message>" } }` (FR-023) |
| `429 Too Many Requests` | Rate limited / spam | `{ "ok": false, "error": "<localized message>" }` |
| `500` | Unexpected server error | `{ "ok": false, "error": "<localized message>" }` |

### Server-side behavior

1. Validate + spam-check. On success, persist `Inquiry` with `consentAt`, `submittedAt`,
   `expiresAt = submittedAt + 24 months`, `status = new`.
2. Fire studio email notification via `afterChange` hook — **best-effort**: failure is logged and
   retried out-of-band and MUST NOT fail the request or lose the stored inquiry (FR-029).
3. Return `201` with a localized confirmation regardless of email outcome.

### Failure isolation (Constitution V)

Email/analytics errors are caught, logged (Pino, structured), and never propagate to the visitor
response or roll back the write.

## Conversion event

On `201`, the frontend emits a cookieless `inquiry_submitted` analytics event (FR-011b).
