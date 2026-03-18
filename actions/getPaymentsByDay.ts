import { prisma } from "@/lib/prisma";
import { getPaymentsCountByDay } from "@/prisma/generated/sql";

export type PaymentByDayData = {
	day: string;
	count: number;
};

export default async function getPaymentsByDay(): Promise<PaymentByDayData[]> {
	const payments = await prisma.$queryRawTyped(
		getPaymentsCountByDay(new Date("2025-12-30 00:00:00")),
	);
	return payments
		.filter(
			(payment): payment is typeof payment & { day: Date } =>
				payment.day instanceof Date,
		)
		.map((payment) => ({
			day: payment.day.toISOString(),
			count: Number(payment.count),
		}));
}
