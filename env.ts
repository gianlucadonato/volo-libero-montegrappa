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
		AWS_S3_XC_BUCKET: z.string().optional(),
		AWS_S3_ELMETEO_BUCKET: z.string().optional(),
		R2_ACCOUNT_ID: z.string().optional(),
		R2_ACCESS_KEY_ID: z.string().optional(),
		R2_SECRET_ACCESS_KEY: z.string().optional(),
		R2_BUCKET_NAME: z.string().optional(),
	},
	client: {
		// 🌐 Client-side vars (browser safe)
		NEXT_PUBLIC_APP_URL: z.string().min(1),
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
		AWS_S3_XC_BUCKET: process.env.AWS_S3_XC_BUCKET,
		AWS_S3_ELMETEO_BUCKET: process.env.AWS_S3_ELMETEO_BUCKET,
		R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
		R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
		R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
		R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	},
});
