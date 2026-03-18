import { prisma } from "@/lib/prisma";

export default async function getPayments({
	from = "2025-12-30 00:00:00",
} = {}) {
	const payments = await prisma.payment.findMany({
		where: { createdAt: { gte: new Date(from) } },
		orderBy: { createdAt: "desc" },
		include: { user: true, creator: true },
	});
	return payments;
}
