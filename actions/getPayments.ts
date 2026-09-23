import { prisma } from "@/lib/prisma";

/**
 * Payments, optionally narrowed to a window.
 *
 * The window is half-open — `start` included, `end` excluded — so consecutive
 * seasons taken from `seasonRange()` never count the same payment twice. Called
 * without bounds it returns every payment, which is what the payments table
 * wants; the dashboard passes a season.
 */
export default async function getPayments({
	start,
	end,
}: {
	start?: Date;
	end?: Date;
} = {}) {
	const payments = await prisma.payment.findMany({
		where:
			start || end
				? {
						createdAt: {
							...(start && { gte: start }),
							...(end && { lt: end }),
						},
					}
				: undefined,
		orderBy: { createdAt: "desc" },
		include: { user: true, creator: true },
	});
	return payments;
}
