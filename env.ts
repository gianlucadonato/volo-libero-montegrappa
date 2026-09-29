import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		// 🛡️ Server-side vars (never browser)
		VLM_ENV: z.string().min(1),
		NEXTAUTH_URL: z.string().optional(),
		BETTER_AUTH_URL: z.string().optional(),
		BETTER_AUTH_SECRET: z.string().min(1),
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		DATABASE_URL: z.string().min(1),
		EMAIL_FROM: z.string().min(1),
		RESEND_API_KEY: z.string().min(1),
		STRIPE_API_KEY: z.string().min(1),
		STRIPE_API_SECRET: z.string().min(1),
		STRIPE_WEBHOOK_SECRET: z.string().min(1),
		AWS_REGION: z.string().optional(),
		AWS_ACCESS_KEY_ID: z.string().optional(),
		AWS_SECRET_ACCESS_KEY: z.string().optional(),
		AWS_S3_XC_PUBLIC_BUCKET: z.string().optional(),
		AWS_S3_ELMETEO_BUCKET: z.string().optional(),
		// Bearer token the ElMeteo uploader authenticates with; it also gates the
		// S3 retention cleanup triggered by that endpoint.
		ELMETEO_API_TOKEN: z.string().min(1),
		// Where converted map frames are cached. Defaults to the OS temp dir, which
		// is wiped on reboot: point it at a persistent path in production.
		ELMETEO_CACHE_DIR: z.string().optional(),
		// elmeteo.it credentials. Four of the six take-off pages redirect to a
		// login wall when unauthenticated; without these the scraper still
		// collects the two public ones.
		ELMETEO_USERNAME: z.string().optional(),
		ELMETEO_PASSWORD: z.string().optional(),
		// Bearer token the forecast scrape trigger authenticates with. Kept
		// separate from ELMETEO_API_TOKEN so the cron cannot also drive the S3
		// retention cleanup that token gates.
		ELMETEO_SCRAPE_TOKEN: z.string().min(1).optional(),
		// Observability: logs and traces are exported to PostHog over OTLP. Both
		// are optional so the app still boots with the exporters disabled.
		OTEL_EXPORTER_ENABLED: z
			.enum(["true", "false"])
			.optional()
			.transform((v) => v === "true"),
		LOG_APP_NAME: z.string().optional(),
		LOG_LEVEL: z.string().optional(),
		R2_ACCOUNT_ID: z.string().optional(),
		R2_ACCESS_KEY_ID: z.string().optional(),
		R2_SECRET_ACCESS_KEY: z.string().optional(),
		R2_BUCKET_NAME: z.string().optional(),
		// Telegram bot that announces new events in the club group. All three are
		// needed; without any of them announcements are skipped.
		TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
		// The group's id, e.g. "-1001234567890".
		TELEGRAM_CHAT_ID: z.string().min(1).optional(),
		// The events topic's message_thread_id, the first number in a topic
		// message link: t.me/c/<chat>/<topic_id>/<message_id>.
		TELEGRAM_EVENTS_TOPIC_ID: z.coerce.number().int().positive().optional(),
	},
	client: {
		// 🌐 Client-side vars (browser safe)
		NEXT_PUBLIC_APP_URL: z.string().min(1),
		NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().optional(),
		NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
	},
	runtimeEnv: {
		// 🔄 Runtime values (don't change!)
		VLM_ENV: process.env.VLM_ENV,
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		EMAIL_FROM: process.env.EMAIL_FROM,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		STRIPE_API_KEY: process.env.STRIPE_API_KEY,
		STRIPE_API_SECRET: process.env.STRIPE_API_SECRET,
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		AWS_REGION: process.env.AWS_REGION,
		AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
		AWS_S3_XC_PUBLIC_BUCKET: process.env.AWS_S3_XC_PUBLIC_BUCKET,
		AWS_S3_ELMETEO_BUCKET: process.env.AWS_S3_ELMETEO_BUCKET,
		ELMETEO_API_TOKEN: process.env.ELMETEO_API_TOKEN,
		ELMETEO_CACHE_DIR: process.env.ELMETEO_CACHE_DIR,
		ELMETEO_USERNAME: process.env.ELMETEO_USERNAME,
		ELMETEO_PASSWORD: process.env.ELMETEO_PASSWORD,
		ELMETEO_SCRAPE_TOKEN: process.env.ELMETEO_SCRAPE_TOKEN,
		OTEL_EXPORTER_ENABLED: process.env.OTEL_EXPORTER_ENABLED,
		LOG_APP_NAME: process.env.LOG_APP_NAME,
		LOG_LEVEL: process.env.LOG_LEVEL,
		R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
		R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
		R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
		R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
		TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
		TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
		TELEGRAM_EVENTS_TOPIC_ID: process.env.TELEGRAM_EVENTS_TOPIC_ID,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
			process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
		NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	},
});
