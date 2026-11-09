import { compare } from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { bearer } from "better-auth/plugins";
import { sendResetPasswordEmail } from "@/emails/sendResetPasswordEmail";
import { sendVerifyEmail, verifyEmailLanguage } from "@/emails/sendVerifyEmail";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/prisma/generated/enums";
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
		type: ["USER", "ADMIN"] as UserRole[],
		required: false,
		defaultValue: "USER",
		input: false, // don't allow user to set role
	},
};

const baseURL =
	env.BETTER_AUTH_URL ?? env.NEXTAUTH_URL ?? env.NEXT_PUBLIC_APP_URL;

const devTrustedOrigins =
	env.VLM_ENV === "production"
		? []
		: [
				"http://local.infinicloud.net:3000",
				"http://localhost:3000",
				"http://127.0.0.1:3000",
			];

const trustedOrigins = Array.from(
	new Set([
		baseURL,
		"https://*.vololiberomontegrappa.it",
		...devTrustedOrigins,
	]),
);

export const auth = betterAuth({
	baseURL,
	trustedOrigins,
	plugins: [bearer()],
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		// No session until the email is verified: signing up no longer logs the
		// user in, and signing in with an unverified email is refused (and resends
		// the link, see `emailVerification.sendOnSignIn`). Accounts created before
		// this was turned on are unverified too, so they verify at their next login.
		requireEmailVerification: true,
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
		// The reset link was delivered to the inbox, which proves the address as
		// well as the verification link would have.
		onPasswordReset: async ({ user }) => {
			if (user.emailVerified) return;
			await prisma.user.update({
				where: { id: user.id },
				data: { emailVerified: true },
			});
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		expiresIn: 60 * 60 * 24,
		sendVerificationEmail: async ({ user, url }, request) => {
			// Never fail the sign-up or sign-in over a mail hiccup: the account is
			// already there, and the verify page lets the user ask for a new link.
			try {
				await sendVerifyEmail({
					email: user.email,
					firstName: (user as { firstName?: string }).firstName || user.name,
					url,
					language: verifyEmailLanguage(request),
				});
			} catch (error) {
				logger.error(
					{ error, userId: user.id },
					"failed to send the verification email",
				);
			}
		},
	},
	user: {
		additionalFields,
	},
	hooks: {
		before: createAuthMiddleware(async (context) => {
			if (context.path === "/sign-in/email") {
				// Check soft-deleted users during sign-in
				if (context.body?.email) {
					const user = await prisma.user.findUnique({
						where: { email: context.body.email as string },
					});
					if (user?.deletedAt) {
						throw new APIError("BAD_REQUEST", {
							message: "User account has been deleted",
						});
					}
				}
			}
		}),
	},
});
