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

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
# HUSKY=0 skips the "prepare" git-hook install: there is no .git in the image.
ENV HUSKY=0
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
	pnpm config set store-dir /pnpm-store \
	&& pnpm install --frozen-lockfile --prefer-offline

# ---- builder: generate the Prisma client and build the app ----
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends libatomic1 ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# NEXT_PUBLIC_* is inlined into the client bundle at build time, so it must be a
# real value here rather than a runtime env var.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

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
RUN NODE_OPTIONS="--max-old-space-size=4096" \
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
# Not included in standalone by Next — must be copied explicitly.
# public/ is NOT listed here on purpose: Next already copies it into
# .next/standalone/public, so copying it again would duplicate ~250MB
# into a second layer (layers are additive, the image pays for both).
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# lib/news.ts calls createReader(process.cwd()) and reads these Markdoc files at
# request time. Without this, /news renders no articles and /news/[slug] 404s.
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
