# syntax=docker/dockerfile:1

# Multi-stage build producing a Next.js standalone image.
#
# Why standalone: `next build` with output: "standalone" traces the modules the
# server actually imports, so the runtime image ships ~150 MB of dependencies
# instead of the full ~1.9 GB node_modules. Smaller layers also mean Dokploy's
# post-build `docker buildx rm` no longer times out deleting the builder volume.
#
# Why --webpack: Turbopack's standalone output is broken on Next 16.2.x — it
# emits hashed module directories (pino-<hash>, pg-<hash>) into .next/node_modules
# that fail to resolve at runtime. See vercel/next.js#91654. Revisit once fixed.

ARG NODE_VERSION=24.20.0

# ---- deps: install full dependencies against the lockfile ----
FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app

# libatomic1 is needed by some native deps (matches what railpack installed).
RUN apt-get update \
	&& apt-get install -y --no-install-recommends libatomic1 ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# The pnpm version comes from the "packageManager" field in package.json, so it
# is pinned in one place and cannot drift from what developers run locally.
RUN corepack enable

# pnpm-workspace.yaml is required: it carries the allowBuilds decisions, and
# pnpm 10+ fails the install while any dependency build script is undecided.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# HUSKY=0 skips the "prepare" git-hook install: there is no .git in the image.
ENV HUSKY=0
# --store-dir must be a flag, not `pnpm config set`: on pnpm 12 that subcommand
# writes to the *global* config rather than the project, so it would not apply.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
	pnpm install --frozen-lockfile --prefer-offline --store-dir /pnpm-store

# ---- builder: generate the Prisma client and build the app ----
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends libatomic1 ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# NEXT_PUBLIC_* is inlined into the client bundle at build time, so it must be a
# real value here rather than a runtime env var.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ARG NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ENV NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=${NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}

# PostHog source map upload (see next.config.ts): which project, and the commit
# to tag the release with, since .git is not in the build context. The personal
# API key is a BuildKit secret mounted into the build step below, so it never
# lands in an image layer. Without it the build skips the upload.
ARG POSTHOG_PROJECT_ID
ENV POSTHOG_PROJECT_ID=${POSTHOG_PROJECT_ID}
ARG GIT_COMMIT_SHA
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}

# The Prisma client is committed under prisma/generated, so no `prisma generate`
# step is needed. Regenerating here would fail anyway: the typedSql preview
# feature introspects prisma/sql/*.sql against a live database.
#
# @/env validates required vars with Zod at import time and Next evaluates that
# during the build, so the build needs values present. These placeholders are
# scoped to this RUN only (never persisted into an image layer); Dokploy injects
# the real values at runtime.
# The webpack build needs more than V8's default heap on this codebase. This
# runs on a GitHub Actions runner (4 cores / 16GB), not on the Dokploy host —
# building there drove the load average to 77 and took the site offline.
RUN --mount=type=secret,id=posthog_personal_api_key,env=POSTHOG_PERSONAL_API_KEY \
	NODE_OPTIONS="--max-old-space-size=4096" \
	VLM_ENV=production \
	BETTER_AUTH_SECRET=build-placeholder \
	GOOGLE_CLIENT_ID=build-placeholder \
	GOOGLE_CLIENT_SECRET=build-placeholder \
	DATABASE_URL=postgresql://build:build@localhost:5432/build \
	EMAIL_FROM=build@example.com \
	RESEND_API_KEY=build-placeholder \
	STRIPE_API_KEY=build-placeholder \
	STRIPE_API_SECRET=build-placeholder \
	STRIPE_WEBHOOK_SECRET=build-placeholder \
	ELMETEO_API_TOKEN=build-placeholder \
	pnpm exec next build --webpack

# ---- runner: minimal runtime image ----
FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends libatomic1 ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
	&& useradd --system --uid 1001 --gid nodejs nextjs

# standalone/ carries server.js plus the traced node_modules (pnpm symlinks and
# their .pnpm targets are all inside it, so it is self-contained).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Neither of these is included in standalone by Next — both must be copied
# explicitly. public/ in particular: standalone only carries the handful of
# files module tracing happened to pull in (4 of 238 here), NOT the directory,
# so without this line every static asset 404s — favicon, site.webmanifest,
# backgrounds, openapi.json.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# lib/news.ts calls createReader(process.cwd()) and reads these Markdoc files at
# request time. Without this, /news renders no articles and /news/[slug] 404s.
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
