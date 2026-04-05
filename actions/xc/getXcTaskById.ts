import { prisma } from "@/lib/prisma";

export default async function getXcTaskById(id: string) {
	return prisma.xcTask.findUnique({
		where: { id },
	});
}
