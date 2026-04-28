import { prisma } from "@/lib/prisma";
import { isSocio } from "../helpers/isSocio";

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

export const getSocio = async (userId: string) => {
	const socio = await prisma.user.findFirst({
		where: { id: userId },
		include: { memberships: true },
	});
	return isSocio(socio) ? socio : null;
};
