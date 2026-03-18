import { prisma } from "@/lib/prisma";

export const getUserByEmail = async (email: string) => {
	try {
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase().trim() },
		});
		return user;
	} catch {
		return null;
	}
};

export const getUserById = async (id: string) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id },
			include: {
				payments: {
					include: {
						creator: true,
					},
				},
				memberships: true,
				coupons: true,
			},
		});
		return user;
	} catch (_err) {
		return null;
	}
};
