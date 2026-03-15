import { compare } from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";

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
export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL ?? env.NEXTAUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
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
	},
	user: {
		additionalFields,
	},
});
