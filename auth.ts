import { compare } from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { sendResetPasswordEmail } from "@/emails/sendResetPasswordEmail";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import getUserById from "./actions/getUserById";

export const additionalFields = {
	firstName: {
		type: "string" as const,
		required: true,
	},
	lastName: {
		type: "string" as const,
		required: true,
	},
	role: {
		type: ["USER", "ADMIN"] as ["USER", "ADMIN"],
		required: false,
		defaultValue: "USER",
		input: false, // don't allow user to set role
	},
};

const baseURL =
	env.BETTER_AUTH_URL ?? env.NEXTAUTH_URL ?? env.NEXT_PUBLIC_APP_URL;

const devTrustedOrigins =
	env.NODE_ENV === "production"
		? []
		: [
				"http://local.infinicloud.net:3000",
				"http://localhost:3000",
				"http://127.0.0.1:3000",
			];

const trustedOrigins = Array.from(new Set([baseURL, ...devTrustedOrigins]));

export const auth = betterAuth({
	baseURL,
	trustedOrigins,
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		password: {
			hash: async (password) => {
				return hashPassword(password);
			},
			verify: async ({ hash, password }) => {
				// Support both bcrypt (old pwd) and better-auth hashes
				if (hash.includes(":")) {
					return verifyPassword({ hash, password });
				}

				if (/^\$2[aby]\$\d{2}\$/.test(hash)) {
					return compare(password, hash);
				}

				return false;
			},
		},
		sendResetPassword: async ({ user, token }, _) => {
			const dbUser = await getUserById(user.id);
			if (!dbUser) return;
			await sendResetPasswordEmail({
				user: dbUser,
				token,
			});
		},
	},
	user: {
		additionalFields,
	},
});
