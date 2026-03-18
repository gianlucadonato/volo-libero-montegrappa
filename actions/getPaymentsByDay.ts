import { prisma } from "@/lib/prisma";
import { getPaymentsCountByDay } from "@/prisma/generated/sql";

export default async function getPaymentsByDay() {
	const payments = await prisma.$queryRawTyped(
		getPaymentsCountByDay(new Date("2025-12-30 00:00:00")),
	);
	return payments
		.filter((p) => Boolean(p.day))
		.map((payment) => ({
			day: payment.day?.toISOString(),
			count: Number(payment.count),
		}));
}
