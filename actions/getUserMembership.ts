import { prisma } from "@/lib/prisma";

export default async function getUserMembership({
	userId,
	year,
}: {
	userId?: string;
	year: number;
}) {
	if (!userId) return null;
	const membership = await prisma.userMembership.findFirst({
		where: { userId, membership: { year } },
		include: { membership: true },
	});
	return membership;
}
