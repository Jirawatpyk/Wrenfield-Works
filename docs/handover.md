# Operations Handover — Wrenfield Works Enterprise Site + CMS

**Audience:** the on-call platform/ops engineer who runs this system in production.
**Product:** Wrenfield Works Enterprise Site + CMS — a bilingual (EN/ไทย) marketing site with an
embedded Payload CMS back office, a PDPA-compliant inquiry capture flow, and cookieless analytics.
**Stack:** Next.js 16 (App Router, React 19) + Payload CMS 3.85 + PostgreSQL 16, TypeScript,
Tailwind v4 tokens. Node ≥ 20.9, pnpm 10.
**Region:** Asia-Pacific Singapore (`ap-southeast-1`) for PDPA data residency — see §1.

This document is the single operational source of truth. For *what* the system does, read
`CLAUDE.md`, `specs/001-enterprise-site-cms/plan.md`, `specs/001-enterprise-site-cms/research.md`,
`specs/001-enterprise-site-cms/quickstart.md`, and `specs/001-enterprise-site-cms/data-model.md`.

> **Constitution gates (binding).** `.specify/memory/constitution.md` makes **Security** and
> **Test-First** NON-NEGOTIABLE, and also gates i18n, UX, Stability/Performance, UI, and Code
> Quality. Operationally this means: deny-by-default access, secrets via env only, TLS everywhere,
> CI-enforced performance budgets (LCP < 2.5s, INP < 200ms, CLS < 0.1, public route JS ≤ 200 KB
> gzipped), and WCAG 2.1 AA on **both** the public site and the back office, in **both** themes
> (dark default + paper). Do not bypass these in production.

---

## 1. Hosting topology & data residency

Everything that touches personal data lives in **one region: Asia-Pacific Singapore
(`ap-southeast-1`)**. This is a PDPA data-residency requirement, not a preference.

```
                         ┌──────────────────────────── ap-southeast-1 (Singapore) ────────────────────────────┐
   Visitors / staff      │                                                                                      │
        │                │   ┌────────────────────────────┐        ┌──────────────────────────────┐           │
        │   HTTPS (TLS)   │   │  Next.js 16 app (one        │  SQL   │  PostgreSQL 16 (managed)     │           │
        └────────────────┼──▶│  deployable)                │───────▶│  - content + versions/drafts │           │
   TLS terminated         │   │  - (frontend)/[locale]/    │        │  - Inquiries (personal data) │           │
   in-region by platform  │   │      public site /en /th   │        │  - Users (staff)             │           │
                          │   │  - (payload)/ admin +      │        └──────────────────────────────┘           │
                          │   │      REST/GraphQL  /admin  │                                                    │
                          │   │  - /api/inquiries/submit   │  S3 API ┌──────────────────────────────┐          │
                          │   │  - /health                 │────────▶│  Object storage (S3-compat)  │          │
                          │   │  - src/proxy.ts locale     │         │  media + OG images           │          │
                          │   │      routing (Node runtime)│         │  (only if S3_BUCKET set)     │          │
                          │   └──────────────┬─────────────┘         └──────────────────────────────┘          │
                          │                  │ best-effort SMTP                                                 │
                          │                  ▼                       ┌──────────────────────────────┐          │
                          │         studio inbox (email)             │  Cookieless analytics        │          │
                          │                                          │  (Plausible/Umami, in-region)│          │
                          │   ┌────────────────────────────┐         └──────────────────────────────┘          │
                          │   │  Cron scheduler (in-region) │                                                   │
                          │   │  daily → pnpm retention     │                                                   │
                          │   └────────────────────────────┘                                                   │
                          └──────────────────────────────────────────────────────────────────────────────────┘
```

Key topology facts:

- **One deployable.** The public site, the Payload admin UI, the content REST/GraphQL API, the
  public inquiry write-path, and `/health` are all the *same* Next.js process. There is no separate
  CMS service to deploy or secure. Payload mounts inside the App Router.
- **Route groups.** Public, per-locale pages live under `src/app/(frontend)/[locale]/`; the admin
  UI + REST/GraphQL live under `src/app/(payload)/` (never locale-prefixed). Locale routing
  (`/en`, `/th`, default redirect) is done by `src/proxy.ts` — Next.js 16 renamed `middleware.ts` →
  `proxy.ts` and the export `middleware` → `proxy`. It runs on the **Node runtime** (no edge),
  which is fine because the whole deployment is a single in-region Node process.
- **Database, object storage, analytics, cron, and the app are ALL in `ap-southeast-1`.** Do not
  add a US/EU read replica, a non-region S3 bucket, or a non-region analytics endpoint for inquiry-
  adjacent data. Personal data must not leave Singapore.
- **TLS is terminated in-region by the hosting platform.** The application-level guarantee that TLS
  is actually used is **HSTS**, set in `next.config.mjs` (`headers()`):
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. The same block sets
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and
  `X-Frame-Options: SAMEORIGIN` on every route. If you front the app with a CDN/edge, ensure it
  does **not** strip these headers and that it forwards HTTPS to origin.
- **`NEXT_PUBLIC_SERVER_URL` must be the real public HTTPS origin in production.** It drives
  absolute URLs, CORS, and the links in notification emails.

---

## 2. Environment variables

Source of truth: **`.env.example`** (copy to `.env`, fill real values, **never commit `.env`** —
it is gitignored). Secrets come from env/secret store only (Constitution: Security). Every variable
in the template is listed below.

| Variable | Purpose | Required? | If unset / misconfigured |
|---|---|---|---|
| `DATABASE_URI` | PostgreSQL 16 connection string. Prod = managed Postgres in `ap-southeast-1`. | **Required** | App cannot start; Payload has no datastore. Local default points at the docker-compose Postgres. |
| `PAYLOAD_SECRET` | Long random secret Payload uses to sign tokens/sessions. Generate `openssl rand -base64 32`. | **Required** | Sessions/tokens are insecure or app fails to boot. **Must be strong & unique per environment.** Rotating it invalidates existing admin sessions. |
| `NEXT_PUBLIC_SERVER_URL` | Public origin for absolute URLs, CORS, email links. | **Required (prod)** | Defaults to `http://localhost:3000`; in prod that breaks CORS, canonical URLs, and email links. Set to the real HTTPS origin. |
| `SMTP_HOST` | SMTP server host for studio inquiry notifications. | Optional | **No SMTP_HOST → console transport only.** Notification emails are NOT delivered; they are logged. The inquiry is still stored. See §5. |
| `SMTP_PORT` | SMTP port (default `587`). | Optional | Falls back to `587`. |
| `SMTP_USER` | SMTP auth username. | Optional (req. if host needs auth) | Auth fails if the host requires credentials. |
| `SMTP_PASS` | SMTP auth password. | Optional (req. if host needs auth) | Auth fails if the host requires credentials. |
| `EMAIL_FROM` | `From:` header on notification emails. | Optional | Provider may reject unverified senders. Set to a sender you control (SPF/DKIM aligned). |
| `INQUIRY_NOTIFY_TO` | Recipient of new-inquiry notifications (FR-029). | **Required for notifications** | If unset/wrong, the studio never sees new inquiries by email (they remain in the admin inbox). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Cloudflare Turnstile site key (rendered in the form). | **Required (prod)** | **Unset → the Turnstile challenge is skipped.** Bots face only honeypot + rate limit. See §6. |
| `TURNSTILE_SECRET` | Server-side Turnstile verification secret. | **Required (prod)** | **Unset → server-side challenge verification is skipped.** Set both Turnstile vars together in prod. |
| `INQUIRY_RATE_LIMIT_MAX` | Max inquiries per IP per window (default `5`). | Optional | Defaults to 5. |
| `INQUIRY_RATE_LIMIT_WINDOW_MS` | Rate-limit window in ms (default `3600000` = 1h). | Optional | Defaults to 1 hour → effective default is **5 submissions / IP / hour**. |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` | Site domain registered in the cookieless analytics tool. | Optional | **No analytics vars → no tracking script injected, and no cookie banner** (cookieless by design, FR-011b). |
| `NEXT_PUBLIC_ANALYTICS_SCRIPT_URL` | URL of the analytics script (Plausible/Umami, in-region). | Optional | Same as above — analytics simply absent. Must be paired with the domain var to take effect. |
| `S3_ENDPOINT` | S3-compatible endpoint for media. | Optional | If `S3_BUCKET` is unset, ignored. |
| `S3_REGION` | Object-storage region (template = `ap-southeast-1`). | Optional | Keep `ap-southeast-1` for residency. |
| `S3_BUCKET` | Media/OG bucket name. **Presence of this var toggles S3 storage.** | Optional | **No `S3_BUCKET` → media is stored on local disk** (`@payloadcms/storage-s3` is only wired when the bucket is set). Local disk is ephemeral on most platforms — use S3 in prod. |
| `S3_ACCESS_KEY_ID` | S3 access key. | Optional (req. if S3 enabled) | Uploads fail if S3 is enabled without valid creds. |
| `S3_SECRET_ACCESS_KEY` | S3 secret key. | Optional (req. if S3 enabled) | Uploads fail if S3 is enabled without valid creds. |
| `PREVIEW_SECRET` | Shared secret the draft-preview route checks before enabling Next.js draft mode (FR-018, HMAC-signed). | **Required (prod)** | A weak/default value lets anyone view unpublished drafts. **Must be a strong random value in prod** (`openssl rand -base64 32`). |
| `ADMIN_EMAIL` | Email of the first staff user, created by `pnpm seed`. | **Required for bootstrap** | No first admin can be seeded. |
| `ADMIN_PASSWORD` | Password of the first staff user. | **Required for bootstrap** | **Seed refuses the default password in production** — you must set a strong one. See §3. |
| `INQUIRY_RETENTION_MONTHS` | Retention window in months (PDPA default `24`, FR-027). | Optional | Defaults to 24. Do not lengthen without a documented legal basis. |

**Strong-secret checklist before any prod deploy:** `PAYLOAD_SECRET`, `PREVIEW_SECRET`, and
`ADMIN_PASSWORD` must all be changed away from the `change-me-*` template values. Both Turnstile
keys must be set. `NEXT_PUBLIC_SERVER_URL` must be the real HTTPS origin.

---

## 3. First deploy & admin bootstrap

Order of operations for a fresh production environment:

1. **Provision in-region infra** in `ap-southeast-1`: managed PostgreSQL 16, the object-storage
   bucket (if using S3), the analytics instance (if used), and the cron scheduler.
2. **Create `.env`** from `.env.example` with real production values. Complete the strong-secret
   checklist in §2.
3. **Install & build.**
   ```bash
   pnpm install
   pnpm generate:types      # regenerate src/payload-types.ts if schema changed
   pnpm lint                # eslint + prettier --check + tsc --noEmit (all three)
   ```
4. **Apply the schema / migrations.** Payload's Postgres adapter manages the schema. On first boot
   against an empty database it creates the required tables (content, localization, drafts/versions,
   Users, Inquiries, Media). Run this against the production `DATABASE_URI` before serving traffic.
   (Local equivalent: `docker compose up -d db` then start the app.)
5. **Bootstrap the first staff user.**
   ```bash
   pnpm seed
   ```
   `pnpm seed` (`PAYLOAD_SEED=true payload run src/seed/seed.ts`) is **idempotent** and creates the
   first staff user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. **It refuses to run with the default
   `change-me-*` password when `NODE_ENV=production`** — set a strong `ADMIN_PASSWORD` first. After
   first login, create individual named accounts for each editor and rotate/retire the bootstrap
   account; do not share it.
6. **Start the app** (`pnpm dev` for local; your platform's production start for prod). Verify:
   - Public site at `/en` and `/th`.
   - Admin at `/admin` — log in with the bootstrapped account.
   - `GET /health` returns `200` with `{"status":"ok","db":"ok",...}` (see §7).
7. **Schedule the retention cron** (see §4) and **wire the alert sinks** for the two failure metrics
   (see §4/§7). Do not consider the deploy "done" until retention is scheduled — it is a PDPA
   obligation.

Access is **deny-by-default** (`src/access/`): no unauthenticated back-office access, and only
authenticated staff can read/write content. Do not loosen this.

---

## 4. The retention job (PDPA — FR-027 / FR-027a)

**What it does.** Permanently **deletes** (not anonymizes) every inquiry whose record is older than
`INQUIRY_RETENTION_MONTHS` (default 24). This is a hard PDPA requirement: the *whole* inquiry record
goes, not just selected fields.

**Entry point.** `src/jobs/retention.ts`, run via:
```bash
pnpm retention      # → payload run src/jobs/retention.ts → runRetention() in src/lib/retention.ts
```

**Schedule.** Run it **daily** via the **in-region** cron scheduler (same region as the DB). Example
crontab (run at 02:15 Singapore time):
```
15 2 * * *   cd /srv/wrenfield && pnpm retention >> /var/log/wrenfield/retention.log 2>&1
```
Adjust the path/working dir to your deployment. Ensure the scheduler runs in `ap-southeast-1` and
has the same `.env` (it needs `DATABASE_URI` and `INQUIRY_RETENTION_MONTHS`).

**Self-healing / idempotency.** The deletion query is purely time-based (everything older than the
cutoff), so it is idempotent and **self-catches-up**: if a run is missed or fails, the next run
simply removes everything still past the cutoff. No manual backfill is needed (FR-027a).

**Monitoring (must be wired).** On failure the job:
- increments the **`retention.run.failed`** metric counter,
- logs a structured Pino error (`log.error({ err }, 'retention job failed')` from the
  `retention-job` child logger), and
- **exits non-zero (`process.exit(1)`)** so the scheduler records a failed run.

On success it logs `retention job finished` with the deleted count and exits `0`. The happy path is
wrapped in a `retention.run` trace.

**Action:** wire **`retention.run.failed`** to your alert sink and alert the on-call engineer on any
non-zero exit. A repeatedly failing retention job is a **compliance incident**, not just an outage —
treat it with priority. Also wire **`inquiry.email.failed`** (see §5/§7) to the same alert sink.

---

## 5. Email — studio inquiry notifications (FR-029)

**Module:** `src/lib/email.ts`. When a new inquiry is stored, the studio is notified by email.

**Transport selection (important):** the `@payloadcms/email-nodemailer` SMTP transport is wired
**only when `SMTP_HOST` is set**. With no `SMTP_HOST`, the system uses a **console transport** — the
email body is logged, not delivered. To make notifications actually arrive in production, set:
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and `INQUIRY_NOTIFY_TO`
(the recipient).

**Failure isolation (by design, Constitution V / FR-029).** Email is **best-effort** and never
affects the stored inquiry:
- The stored inquiry record is the source of truth. Email send happens *after* the record is saved.
- A send failure is logged and increments **`inquiry.email.failed`**; a success increments
  **`inquiry.email.sent`**; an unconfigured/console path increments **`inquiry.email.unconfigured`**.
- A failed (or unconfigured) email **never rolls back or loses the inquiry**, and never blocks the
  visitor's on-page confirmation (FR-022).

**Operational consequence:** if email is down, **no inquiry is lost** — staff can still see every
inquiry in the admin inbox (`/admin`). Wire **`inquiry.email.failed`** to your alert sink so a
broken SMTP path is noticed quickly, and reconcile the admin inbox against delivered notifications
when recovering from an SMTP outage.

---

## 6. Spam / abuse protection

The **only** public write-path is **`POST /api/inquiries/submit`** (route file
`src/app/api/inquiries/submit/route.ts`). Note: this is **not** `/api/inquiries` — that path belongs
to Payload's collection REST API and is access-controlled separately. Layered defenses
(`research.md` §7, FR-025):

1. **Cloudflare Turnstile** (privacy-friendly, cookieless). **Fail-closed in prod**, but only when
   configured: set **both** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client) and `TURNSTILE_SECRET`
   (server). **If these are unset the challenge is skipped** — so they are effectively required for
   production.
2. **Honeypot** — a hidden field; submissions that fill it are rejected server-side.
3. **Per-IP rate limit** — default **5 submissions per IP per hour** (`INQUIRY_RATE_LIMIT_MAX=5`,
   `INQUIRY_RATE_LIMIT_WINDOW_MS=3600000`). Tune via those env vars.

**X-Forwarded-For trust assumption (read this).** The per-IP rate limit derives the client IP from
forwarded headers (`X-Forwarded-For`). This is only safe when a **trusted** proxy/load balancer in
front of the app sets that header — an attacker can otherwise spoof it and evade the rate limit.

- Run the app **behind a trusted edge/load balancer** that overwrites (not appends) the client-IP
  header.
- **Pin the rate limiter to your platform's verified client-IP header** (e.g. the LB's
  `True-Client-IP` / `CF-Connecting-IP`, or the trusted left-most/right-most `X-Forwarded-For` hop
  per your platform's documented behavior) rather than blindly trusting raw `X-Forwarded-For`.
- Never expose the origin directly to the internet without that trusted edge, or rate limiting can
  be bypassed by header spoofing.

Every submission persists explicit **consent** plus a server-set **24-month `expiresAt`** (the
retention job in §4 enforces deletion). The visitor-facing confirmation does not depend on email
(§5) or analytics (§7).

---

## 7. Observability & health

- **Structured logging:** Pino (`src/lib/logging.ts`, `childLogger(name)`). Logs are structured
  JSON — ship them to your in-region log aggregator. Critical paths (publish, inquiry, retention)
  log explicitly; the retention job uses the `retention-job` child logger.
- **Metrics counters:** in-process counters via `src/lib/observability.ts` (`incr(...)`,
  `trace(...)`, `metricsSnapshot()`). Known counters to watch:
  - **`retention.run.failed`** — retention job failure (§4). **Alert.**
  - **`inquiry.email.failed`** — studio notification send failure (§5). **Alert.**
  - `inquiry.email.sent` / `inquiry.email.unconfigured` — email delivery health.
  - `retention.run` — trace around the retention run.
- **Health endpoint:** `GET /health` (`src/app/health/route.ts`, not locale-prefixed — excluded in
  `proxy.ts`). It probes DB reachability with a cheap `users` count and returns the metric snapshot:
  - `200 {"status":"ok","db":"ok","metrics":{...},"timestamp":...}` when healthy.
  - `503 {"status":"degraded","db":"down",...}` when the database is unreachable.
  - Point your uptime monitor / platform liveness probe at `/health` and page on sustained `503`.
- **Performance budgets** are CI-enforced via Lighthouse (`pnpm lhci`): LCP < 2.5s, INP < 200ms,
  CLS < 0.1, public route JS ≤ 200 KB gzipped. A regression should fail CI before it reaches prod.

---

## 8. Backups & disaster recovery (PostgreSQL)

Postgres is the system of record (content + drafts/versions + Users + **Inquiries personal data**).

- **Backups stay in-region.** Use the managed Postgres provider's automated backups and PITR, and
  ensure backups + snapshots are stored **in `ap-southeast-1` only** — backups of inquiry personal
  data are subject to the same PDPA residency rule as the live DB. Encrypt backups at rest.
- **Recommended posture:** automated daily snapshots + point-in-time recovery (PITR) with a
  retention window appropriate to your RPO. Target RPO ≤ 24h (ideally PITR to minutes) and an RTO
  you can actually meet with a restore drill.
- **Retention interaction:** the retention job (§4) permanently deletes inquiries > 24 months.
  Restoring an **old** backup can resurrect personal data that should have been deleted — after any
  restore that predates a retention run, **re-run `pnpm retention`** immediately so the restored DB
  is brought back into PDPA compliance.
- **Object storage (media/OG):** if using S3 (`S3_BUCKET` set), enable bucket versioning and
  in-region replication/backup per your provider. If `S3_BUCKET` is unset, media is on local disk
  and is **not** durably backed up — another reason to use S3 in prod.
- **DR drill:** periodically restore a snapshot into a staging environment, point a throwaway app at
  it, confirm `/health` is `200`, the admin loads, and `/en` + `/th` render. Record RTO/RPO actuals.
- **Secrets are not in backups.** `.env` is not committed and not in the DB. Keep
  `PAYLOAD_SECRET`, `PREVIEW_SECRET`, DB and SMTP/S3 credentials in your secret store with their own
  backup/rotation plan; a DB restore is useless without them.

---

## 9. PDPA data-subject request (DSR) runbook — individual deletion (FR-028)

When an individual asks for their inquiry/personal data to be deleted (a PDPA data-subject request),
staff handle it directly in the admin inbox — **no engineer or DB access required**:

1. **Verify the requester** owns the data per your DSR/identity-verification policy before acting.
2. **Log in** to the back office at **`/admin`** with a staff account.
3. Open the **Inquiries** collection (the inbox).
4. **Find the individual's record** — search/filter by the email address (or name) they submitted.
   Confirm it is the correct person before deleting; deletion is permanent.
5. **Delete the record** using Payload's delete action. This is a **hard delete** of the whole
   inquiry (consistent with the retention policy: deletion, not anonymization).
6. **Record the action** in your DSR log (who requested, who actioned, date) for auditability, and
   confirm completion to the requester within your policy's SLA.

Notes:
- This is the **manual, on-request** path (FR-028). It is independent of the automatic 24-month
  retention sweep (§4, FR-027) — use this when an individual asks *before* their data would have
  expired.
- If the same person submitted **multiple** inquiries, repeat the search and delete **all** matching
  records.
- After a DB restore (§8) that predates a fulfilled DSR, the deleted record may reappear — re-run
  the manual deletion for that individual after any such restore, in addition to re-running the
  retention job.

---

## Quick command reference (from `package.json`)

```bash
pnpm install                 # install dependencies (pnpm 10)
docker compose up -d db      # local Postgres (prod = managed, ap-southeast-1)
pnpm dev                     # public /en /th + admin /admin
pnpm seed                    # bootstrap first staff user (ADMIN_EMAIL/ADMIN_PASSWORD); idempotent
pnpm generate:types          # regenerate src/payload-types.ts after schema edits
pnpm test                    # Vitest unit + integration
pnpm test:ci                 # tests with coverage
pnpm test:e2e                # Playwright journeys + @axe-core/playwright WCAG 2.1 AA
pnpm lint                    # eslint . + prettier --check . + tsc --noEmit
pnpm lhci                    # Lighthouse CI — assert performance budgets
pnpm retention               # run the PDPA retention job (schedule daily, in-region)
```
