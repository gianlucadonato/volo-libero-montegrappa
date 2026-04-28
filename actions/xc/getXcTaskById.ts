import { prisma } from "@/lib/prisma";

export default async function getXcTaskById(id: string, userId?: string) {
	return prisma.xcTask.findUnique({
		where: { id },
		include: userId
			? {
					submissions: {
						where: { userId },
						orderBy: { editionId: "desc" },
					},
				}
			: undefined,
	});
}
