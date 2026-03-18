import { NEXT_YEAR } from "@/config/constants";

import { prisma } from "@/lib/prisma";

export default async function getUsers() {
	const users = await prisma.user.findMany({
		orderBy: { memberId: "desc" },
		include: {
			payments: true,
			memberships: {
				where: { year: NEXT_YEAR },
			},
		},
	});
	return users;
}
