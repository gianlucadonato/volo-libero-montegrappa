# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Website and member platform for **Volo Libero Montegrappa**, a paragliding club. The public site (in Italian) covers flying sites, weather, news, and events; the member area handles registration, Stripe-based memberships, and the **XC Montegrappa** cross-country competition. Next.js 16 (App Router) + React 19 + TypeScript, Prisma 7 / PostgreSQL, better-auth, Tailwind v4 + shadcn, BlockNote for the news editor.

## Commands

```bash
pnpm dev               # dev server (webpack); pnpm dev:turbo for turbopack
pnpm build             # production build
pnpm typecheck         # tsc --noEmit
pnpm lint              # biome check .
pnpm lint:fix          # biome check . --write --unsafe
pnpm format            # biome format . --write
pnpm test              # vitest run (all tests)
pnpm exec vitest run tests/api/xc/tasks/upload.test.ts   # single test file
pnpm exec vitest run -t "test name"                      # single test by name

# Database (Prisma)
pnpm db:migrate <name> # prisma migrate dev --name <name>
pnpm db:generate       # prisma generate (regenerate the client)
pnpm db:deploy         # apply migrations (prod)
pnpm db:studio
pnpm db:seed:xc-tasks  # seed XC tasks; db:seed:xc-progress for progress

# OpenAPI / typed API client
pnpm openapi           # generate public/openapi.json from route JSDoc annotations
pnpm gen:api-client    # openapi + regenerate types/api-client.d.ts

pnpm tsx scripts/foo.ts  # run a one-off script with .env loaded
pnpm prod <script> [args]  # run a package script against prod through an SSH tunnel (PROD_DATABASE_URL, see README)
```

Husky enforces quality gates: **pre-commit** runs lint-staged (Biome), **pre-push** runs `typecheck` + `test`.

## Conventions

- **Biome** handles lint/format: **tabs**, double quotes, organized imports. Linting is **disabled** for `components/ui/**` (shadcn) and `prisma/generated/**` — don't try to fix lint there.
- Path alias `@/*` maps to the repo root.
- **Env vars**: import the validated `env` from `@/env` (typed via `@t3-oss/env-nextjs` + Zod), not `process.env` directly. `VLM_ENV` is the app environment flag, **not** `NODE_ENV`. Exception: code that runs in the browser bundle must use `NEXT_PUBLIC_*` since server-only vars are undefined client-side.
- Modules marked `import "server-only"` (`lib/logger.ts`, `lib/session.ts`) must never be imported into client components.
- **English everywhere in the repo**, without exception: commit messages, code comments, identifiers, docs, PR descriptions, log and error messages. This holds even when the conversation with the author is in Italian, and even though older commits in the log are Italian — do not match them. The only Italian in the repo is user-facing content: UI strings in `messages/it.json`, the static pages under `content/pages/`, and the Italian public route segments.

## Architecture

### Routing & middleware
- App Router with route groups under `app/(public)`: `(auth)` (login/signup), and nested `(protected)` (profile, admin, soci, documents). Public-facing page segments are Italian (`/atterraggi`, `/decolli`, `/area-volo`, `/meteo`).
- **Next.js 16 renames middleware to `proxy.ts`** (repo root). `proxy()` runs auth gating: redirects unauthenticated users away from `protectedRoutes`/`adminRoutes`, redirects logged-in users away from auth routes, and applies CORS to `/api/*`. API routes always skip middleware auth and enforce auth themselves.

### Auth (better-auth)
- Configured in `auth.ts`: Prisma adapter, email/password + `bearer` plugin. Password verify supports **both** legacy bcrypt hashes and better-auth hashes. A `before` hook blocks sign-in for soft-deleted users (`deletedAt`). `additionalFields` adds `firstName`, `lastName`, `role`.
- Server: `getSessionUser()` from `lib/session.ts` (wrapped in React `cache`). Client: `authClient` from `lib/auth-client.ts`. Roles enum is `USER | ADMIN | MEMBER`; "is this user a current member" logic lives in `helpers/isSocio.ts` (ADMIN, or a membership for `NEXT_YEAR`).

### Data layer
- **`prisma/schema.prisma`** uses the new `prisma-client` generator with `output = ./generated`. Import the client/enums from `@/prisma/generated/...` (e.g. `@/prisma/generated/enums`), **not** `@prisma/client`. Connection uses the `PrismaPg` (pg) adapter — see `lib/prisma.ts`. Soft deletes via `deletedAt`.
- **`actions/`** — server-side data functions: query Prisma, then parse/shape with Zod schemas from `@/schemas`. **`store/`** — lower-level Prisma query helpers (e.g. XC edition/enrollment lookups). Components and routes call these rather than touching Prisma inline.

### API routes & OpenAPI
- Routes in `app/api/**/route.ts` follow a consistent shape: get session via `auth.api.getSession({ headers })`, return `APIErrorResponse(Boom.unauthorized())` when missing, validate params/body with Zod, return `Response.json(...)`. All errors funnel through `helpers/APIErrorResponse.ts` (uses `@hapi/boom`, logs via pino with a request id).
- Each route carries a JSDoc block (`@openapi`, `@auth`, `@response Schema`, `@pathParams`) that `pnpm openapi` reads to emit `public/openapi.json`; `gen:api-client` turns that into `types/api-client.d.ts`. Scalar docs render at `/api-docs`.
- Frontend consumes the API through the typed `openapi-fetch` client in `lib/api-client.ts` and the `openapi-react-query` hook in `hooks/use-query-api.ts`.

### XC Montegrappa (largest feature)
Cross-country competition domain spanning `app/api/xc/*`, `actions/xc/*`, `components/xc/*`, `store/xc.ts`, and `schemas/xc.ts`. Concepts: **editions** (yearly, `XcEdition`), **tasks** (`.tsk`/`.xctsk` route files, categories BASIC/INTERMEDIATE/ADVANCED), **enrollments**, **track submissions** (IGC files, validated → leaderboards/progress). Supporting libs: `lib/igc-parser.ts`, `lib/tsk-parser.ts`, `lib/track-validator.ts`, `lib/xc-task.ts` (task↔QR-code URL mapping — note the per-category vs. global task numbering re-basing).

### News
- Italian only, stored in the `News` table and written by admins in-app at `/news/new` and `/news/<slug>/edit` (no separate CMS login). The body is edited with **BlockNote** (`components/news/NewsEditor.tsx`, client-only via `next/dynamic`); its block JSON in `content` is the source of truth, and `contentHtml` is rendered and **sanitised** on save by `lib/news-render.ts`, then served as-is. Keep the editor and the server renderer on the same schema (`lib/news-schema.ts`).
- `@blocknote/server-util` must stay in `serverExternalPackages` (`next.config.ts`): Next can't bundle it for the server.
- The slug is fixed at creation (`store/news.ts#uniqueNewsSlug`), so edits never break shared links. A news is public when not a draft, not deleted, and `publishedAt` has come; admins see the rest flagged.
- Images (cover and inline) go through `POST /api/news/images` to the public assets bucket under `news/images/`, via `lib/public-images.ts` (shared with event covers).
- Publishing can post the news to the Telegram group's news topic (`announceNews` in `lib/telegram.ts`, `TELEGRAM_NEWS_TOPIC_ID`; events use their own topic). It runs in `after()`, once per news: `upsertNews` claims `announcedAt` atomically, posts only when the news is public now (future-dated news are skipped, not scheduled), and releases the claim if Telegram fails.
- Static legal pages are separate: Markdoc files in `content/pages/`, read by `lib/pages.ts`.

### i18n
- `next-intl` with locales `it` (default) and `en`. Locale is stored in the **`NEXT_LOCALE` cookie**, not in the URL path (`i18n/locale.ts` + `i18n/request.ts`). UI strings live in `messages/{locale}.json`.

### Storage, payments, observability
- Object storage: AWS **S3** (`lib/s3.ts`, presigned upload URLs, XC bucket) and Cloudflare **R2** (`lib/r2.ts`). Both lazily construct their client and throw if credentials are absent.
- **Stripe** checkout + webhooks under `app/api/stripe/*`; drives `Membership`/`Payment`/`Coupon` models. Membership year/price constants in `config/constants.ts` (`NEXT_YEAR`, `MEMBERSHIP_PRICE`).
- Observability: pino logger (`lib/logger.ts`, JSON to stdout plus an OpenTelemetry bridge to PostHog Logs when `OTEL_EXPORTER_ENABLED=true`), Prometheus metrics (`lib/metrics.ts`, exposed at `/api/metrics` behind `METRICS_TOKEN`), OpenTelemetry (`instrumentation.ts`). Local stack in `docker/docker-compose.observability.yml` (Grafana/Loki/Prometheus).

### UI
shadcn components in `components/ui` (style `radix-nova`, base color neutral, lucide icons); `components/extendui` holds customized variants. Tailwind v4 via PostCSS (`app/globals.css`). Forms use react-hook-form + Zod resolvers; tables/queries use TanStack Table/Query; charts use Recharts; maps use Leaflet/react-leaflet; rich text uses Lexical.
