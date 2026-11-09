import { withPostHogConfig } from "@posthog/nextjs-config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
	// Emit a self-contained server bundle (.next/standalone) so the production
	// image ships only traced runtime deps instead of the full node_modules.
	output: "standalone",
	// BlockNote's server renderer imports its React package, which Next refuses
	// to bundle for the server ("export *" in a client boundary). Loaded from
	// node_modules at runtime instead, and still traced into standalone.
	serverExternalPackages: ["@blocknote/server-util"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "randomuser.me",
			},
			{
				protocol: "https",
				hostname: "www.elmeteo.it",
			},
			{
				protocol: "https",
				hostname: "vlm-xc-public.s3.eu-central-1.amazonaws.com",
			},
		],
	},
	allowedDevOrigins: [
		"local.infinicloud.net",
		"http://local.infinicloud.net",
		"https://local.infinicloud.net",
	],
	async headers() {
		return [
			{
				source: "/api/:path*",
				headers: [
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{
						key: "Access-Control-Allow-Methods",
						value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
					},
					{
						key: "Access-Control-Allow-Headers",
						value:
							"Authorization, Content-Type, X-Requested-With, Accept, Origin",
					},
				],
			},
		];
	},
};

const withNextIntl = createNextIntlPlugin();

// Upload the browser source maps to PostHog so error stack traces point at the
// original code. Only when a personal API key is set: the CI image build passes
// one as a BuildKit secret, while local builds and builds without it stay as
// they were. Read from process.env, not @/env: next.config runs before the app.
const posthogPersonalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

export default posthogPersonalApiKey
	? withPostHogConfig(withNextIntl(nextConfig), {
			personalApiKey: posthogPersonalApiKey,
			projectId: process.env.POSTHOG_PROJECT_ID,
			// The API host, not the ingestion one the browser sends events to:
			// https://eu.i.posthog.com -> https://eu.posthog.com.
			host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(
				".i.posthog.com",
				".posthog.com",
			),
			sourcemaps: {
				releaseName: "volo-libero-montegrappa",
				// No .git inside the Docker build, so CI passes the commit SHA.
				releaseVersion: process.env.GIT_COMMIT_SHA,
				// The maps are uploaded, then deleted: never served publicly.
				deleteAfterUpload: true,
				// A PostHog hiccup or a bad key must not block a deploy.
				failOnError: false,
			},
		})
	: withNextIntl(nextConfig);
