# Volo Libero Montegrappa

Website and member platform of **ASD Volo Libero Montegrappa**, the paragliding
and hang gliding club of Borso del Grappa.

- **Public site** (Italian, with an English UI): flying sites, take-offs and
  landings, weather and ElMeteo forecasts, news, events.
- **Member area**: account registration, yearly club membership paid with
  Stripe (or recorded by an admin), membership card with QR verification,
  event registration.
- **XC Montegrappa**: the club's cross-country certificate. Pilots enroll each
  season, fly predefined tasks and upload IGC tracks, which are validated into
  per-category leaderboards.

> [!IMPORTANT]
> Some things are not automatic and must be done by hand **every year**: see
> [Yearly checklist](#yearly-checklist).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 on PostgreSQL ·
better-auth · Tailwind v4 + shadcn/ui · next-intl · Stripe · BlockNote (news
editor) · Vitest · Biome.

Infrastructure: AWS S3 and Cloudflare R2 for files, Resend for email, PostHog
for analytics and logs, a Telegram bot for announcements. Production runs as a
Docker image on a Dokploy server.

## Getting started

Requirements: **Node 24** (the version pinned in the `Dockerfile`), **pnpm**
(version pinned in `package.json#packageManager`), Docker for the local
database.

```bash
pnpm install

# Local PostgreSQL 18 on port 5433 (user/password postgres, db vlm-db)
docker compose -f docker/docker-compose.postgres.yml up -d

# Create .env (see "Environment variables" below), then:
pnpm db:deploy        # apply migrations
pnpm db:generate      # generate the Prisma client
pnpm db:seed:xc-tasks # optional: seed the XC tasks

pnpm dev              # http://localhost:3000
```

### Environment variables

All variables are declared and validated in [`env.ts`](env.ts). Import `env`
from `@/env` in code, never `process.env`. There is no `.env.example`: copy
`env.ts`'s list. The required ones are:

| Variable | Purpose |
| --- | --- |
| `VLM_ENV` | App environment (`development` / `production`). Use this, not `NODE_ENV` |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Auth |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Required by `env.ts` but not used by any code (leftover of the old Google login); any value works |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email |
| `STRIPE_API_KEY`, `STRIPE_API_SECRET`, `STRIPE_WEBHOOK_SECRET` | Membership payments |
| `ELMETEO_API_TOKEN` | ElMeteo uploader / cleanup endpoint |
| `NEXT_PUBLIC_APP_URL` | Public base URL (also used by Stripe redirects) |

Optional groups, each disabling its feature when missing: `AWS_*` (S3: XC
public assets, ElMeteo maps, news and event images), `R2_*` (Cloudflare R2: IGC
tracks), `ELMETEO_*` (forecast scraper, see
[`docs/elmeteo-scraper.md`](docs/elmeteo-scraper.md)), `TELEGRAM_*` (event and
news announcements), `OTEL_EXPORTER_ENABLED` / `LOG_*` (logs to PostHog),
`NEXT_PUBLIC_POSTHOG_*` (analytics). `METRICS_TOKEN` protects the Prometheus
endpoint `/api/metrics`; it is read straight from `process.env`, not declared in
`env.ts`.

## Commands

```bash
pnpm dev               # dev server (webpack); pnpm dev:turbo for turbopack
pnpm build             # production build
pnpm typecheck         # tsc --noEmit
pnpm lint              # biome check .   (pnpm lint:fix to apply fixes)
pnpm test              # vitest run
pnpm exec vitest run tests/lib/xc-season.test.ts   # a single file

pnpm db:migrate <name> # create a migration (prisma migrate dev)
pnpm db:deploy         # apply migrations
pnpm db:studio         # Prisma Studio, handy for editing rows by hand

pnpm gen:api-client    # regenerate public/openapi.json and types/api-client.d.ts
pnpm tsx scripts/<file>.ts   # run a one-off script with .env loaded
```

Git hooks (Husky): **pre-commit** runs Biome on staged files, **pre-push** runs
`typecheck` and `test`. CI runs lint, typecheck and tests on every pull request.

## Project layout

```
app/                 routes (App Router)
  (public)/          public pages; (auth) login/signup; (protected) member and admin area
  api/               REST API, documented via JSDoc → OpenAPI (rendered at /api-docs)
actions/             server-side data functions (Prisma + Zod)
store/               low-level Prisma query helpers
components/          React components (components/ui = shadcn, don't lint)
lib/                 integrations and domain logic (auth, stripe, s3, r2, igc/tsk parsers, seasons…)
schemas/             Zod schemas
messages/{it,en}.json  UI strings
content/pages/       static legal pages (Markdoc)
prisma/              schema, migrations, generated client (import from @/prisma/generated)
scripts/             one-off and yearly maintenance scripts
config/constants.ts  NEXT_YEAR, MEMBERSHIP_PRICE and other constants
proxy.ts             Next 16 middleware: auth gating and CORS
```

[`CLAUDE.md`](CLAUDE.md) has a more detailed architecture tour (auth, data
layer, news, XC, i18n, observability) and the code conventions. Read it
before making non-trivial changes.

Conventions in short: Biome with tabs and double quotes; **English everywhere
in the repo** (code, comments, commits, docs). The only Italian is user-facing
content (`messages/it.json`, `content/pages/`, Italian route segments).

## Deployment

1. Merge to `main`.
2. GitHub Actions (`.github/workflows/build-image.yml`) builds the Docker image
   and pushes it to `ghcr.io/gianlucadonato/volo-libero-montegrappa` with tags
   `latest` and `sha-<commit>`. It then calls the Dokploy webhook.
3. Dokploy pulls `latest` and restarts the service. **The image is never built
   on the server**: that once took production down.

**Migrations are not applied automatically.** When a release contains a new
migration, run `pnpm db:deploy` against the production database (with the
production `DATABASE_URL`) before or right after the deploy.

**Rollback**: point the Dokploy service at the `sha-<commit>` tag of the last
good build instead of `latest`.

If a deploy silently does nothing after the pull, check
`docker service ps --no-trunc <service>` on the server: the Dokploy UI does not
always show the error.

---

## Yearly checklist

The club runs on **two different years**, and they do not turn over on the same
date:

| | Runs | Named after | Turns over | Code |
| --- | --- | --- | --- | --- |
| **XC season** | 1 Oct – 30 Sep | the year it ends in (1 Oct 2026 – 30 Sep 2027 = **2027**) | 1 October, **automatically** | `xcSeasonYear()` in `lib/xc-season.ts` |
| **Membership year** | 15 Dec – 15 Dec | the year it mostly covers (from 15 Dec 2026 = **2027**) | when you bump `NEXT_YEAR` **by hand** | `NEXT_YEAR` in `config/constants.ts` |

Payments and memberships are grouped into membership years in the admin stats
by `lib/season.ts`. That cutoff (15 December) is automatic. What `NEXT_YEAR`
controls is which year is **on sale** and who counts as a **current member**.

Calendar at a glance (example for 2027):

| When | What |
| --- | --- |
| September 2026 | Prepare XC 2027: tasks, rules, assets |
| **30 Sep – 1 Oct 2026** | Create the XC 2027 edition (script) |
| October 2026 | Hand out the XC 2026 certificates at the social dinner |
| Early December 2026 | Prepare the 2027 membership: Stripe price, `membership` row, Flycard coupons, texts |
| **15 December 2026** | Bump `NEXT_YEAR` to 2027 and deploy: 2027 memberships go on sale |

### XC Montegrappa: new season (by 1 October)

The code switches season by itself on 1 October (UTC). What it cannot do is
create the edition in the database. **Until the edition exists, the XC section
shows no tasks and enrollment fails with 404.**

1. **Tasks** (only if they change). `scripts/newXcEdition.ts` copies
   **all** tasks of the previous edition into the new one.
   - New task: upload its map, QR code and `.tsk`/`.xctsk` file to the public
     bucket (`scripts/uploadXcPublicAssets.ts` uploads a local
     `public/xcmontegrappa/` folder; it is not in git). Then add the
     `xc_task` row and link it to the new edition in `xc_edition_tasks`.
     `scripts/seedXcTasks.ts` + `scripts/input/xc-tasks.ts` show the shape.
   - Removed task: delete its `xc_edition_tasks` row **for the new edition
     only**. Keep the `xc_task` row, because past submissions point to it.
   - Changed points: careful, `xc_task` rows are shared between editions.
     Editing `points` changes the past leaderboards too. Create a new task
     instead.
   - Remember the per-category vs. global task numbering in `lib/xc-task.ts`
     (QR code URLs).
2. **Rules**. If there is a new version of the regulations PDF, add it to
   `public/docs/` and update the link in **both**
   `app/(public)/xc/page.tsx` and `components/modals/enroll-xcedition-modal.tsx`
   (currently `REGOLAMENTO v.1.4.pdf`).
3. **Thresholds**. `xc_editions.min_points` / `max_points` default to 700 /
   1000. Edit the new row if the rules change them.
4. **Create the edition**: set `EDITION_YEAR` in `scripts/newXcEdition.ts`
   to the new season and run it against production:

   ```bash
   pnpm tsx scripts/newXcEdition.ts
   ```

   It copies the previous edition's tasks, marks the new edition active and
   deactivates the old one. Run it **on the evening of 30 September or the
   morning of 1 October**:
   - Too early: the leaderboard's default view jumps to the new, empty edition
     while the old season is still running. Uploads still go to the right
     season; only the default view is affected.
   - Too late: from 1 October 00:00 UTC the site already looks for the new
     edition, and the XC section is broken until it exists.
5. **Check**: `/xc` shows the new year, the task pages load, a test
   enrollment works, and the previous edition is still selectable in the
   leaderboards.
6. **October**: certificates are handed out at the social dinner. The final
   leaderboards are in `/xc/<category>/leaderboard` with the old edition
   selected.

Copy in `messages/*.json` describes the season without hard-coded years, so it
does not need yearly edits.

### Membership: new year (by 15 December)

Everything keyed on `NEXT_YEAR` switches at once when it is bumped, so do the
preparation **first** and bump last. Example for 2027:

1. **Stripe price**. In the Stripe dashboard, create the product/price for
   the 2027 membership (or a new price on the existing product). The customer
   sees the product name at checkout. Note the `prod_…` and `price_…` ids.
   Check live vs. test mode: the ids must come from the same mode as
   `STRIPE_API_KEY` in production.
2. **`membership` row**. Add one row for the new year (`pnpm db:studio`
   against production fills in the `id`). Checkout and manual payments look it
   up by `year`, and fail without it.

   | Column | Value |
   | --- | --- |
   | `name` | `Club Volo Libero Montegrappa 2027` (must be unique) |
   | `year` | `2027` |
   | `slug` | follow the previous year's pattern (e.g. `VLM26` → `VLM27`); stored on every payment |
   | `stripe_product_id` / `stripe_price_id` | from step 1 |
   | `valid_from` / `valid_until` | e.g. `2026-12-15` / `2027-12-31 23:59:59`; copied onto members added by an admin |

3. **Flycard coupons**. Every new member is assigned a free Flycard coupon
   code (`coupon` table, `year = 2027`, `type = 'socio'`, `user_id` empty),
   which is sent in the confirmation email. Load the codes received from the
   Consorzio Vivere il Grappa, **enough for the whole year** (2026: ~300
   members):

   ```sql
   INSERT INTO coupon (id, code, year, type)
   SELECT gen_random_uuid()::text, code, 2027, 'socio'
   FROM unnest(ARRAY['CODE1', 'CODE2' /* … */]) AS code;
   ```

   If the coupons run out, an online payment still succeeds, but **no
   confirmation email is sent**. A payment added by an admin fails with
   "Coupon not found!" **after** the payment and membership rows have already
   been written. Watch the remaining count:
   `SELECT count(*) FROM coupon WHERE year = 2027 AND user_id IS NULL;`
4. **Code** (one PR, merged on the opening day):
   - `config/constants.ts`: `NEXT_YEAR = 2027`. Also update
     `MEMBERSHIP_PRICE` if the fee changes. It is the price **shown** on the
     site and the amount of admin-recorded payments, so it must match the
     Stripe price.
   - `messages/it.json` and `messages/en.json`, section
     `PurchaseMembershipCard.info.news`: the Flycard promotion terms (price,
     dates), if the agreement with the Consorzio changes. The rest of the
     membership copy takes the year from `NEXT_YEAR` and the price from
     `MEMBERSHIP_PRICE`.
   - `FLYCARD_DESCRIPTION` (`"Flycard Vivere il Grappa 2025"`), hard-coded in
     `components/membership/MembershipCards.tsx`,
     `actions/getMembershipVerification.ts` and
     `components/MembershipsTable.tsx`. It hides Flycard rows from the
     membership lists. Update it if Flycard rows with a new description are
     created.
5. **Deploy on 15 December**. From that moment:
   - the site sells 2027 memberships;
   - "current member" (`helpers/isSocio.ts`) means "has a 2027 membership".
     Members who have not renewed yet **drop out** of the members list
     (`/soci`) and lose access to members-only event registration right
     away, even though their 2026 card is valid until 31 December.
6. **Check**: buy a membership end to end (test mode, or a real one you then
   refund). The payment, the 2027 `user_membership` row and the coupon
   assignment should all appear, and the confirmation email with the coupon
   should arrive. Check that `/membership` shows the right year and price.
   Check that the Stripe webhook is delivering (Stripe dashboard → Webhooks).
