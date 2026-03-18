import { prisma } from "@/lib/prisma";

export default async function getUserById(id: string) {
	return prisma.user.findUnique({
		where: { id },
	});
}
