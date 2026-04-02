import { prisma } from "@/lib/prisma";

export default async function getTaskById(id: string) {
	return prisma.xcTask.findUnique({
		where: { id },
	});
}
