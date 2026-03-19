import { prisma } from "@/lib/prisma";
import { UserSchema } from "@/schemas";

export default async function getSoci(year: number) {
	const userMemberships = await prisma.userMembership.findMany({
		where: { year },
		include: { user: true },
		orderBy: { user: { lastName: "asc" } },
	});
	const soci = userMemberships.map((p) =>
		UserSchema.parse({
			...p.user,
			registeredAt: p.createdAt.toISOString(),
		}),
	);
	return soci;
}
