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
export default withNextIntl(nextConfig);
