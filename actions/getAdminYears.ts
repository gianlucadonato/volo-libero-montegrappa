import { prisma } from "@/lib/prisma";
import { currentSeason, seasonForDate } from "@/lib/season";

/**
 * The seasons the dashboard can be switched to, newest first.
 *
 * Derived rather than listed, so a new season appears on its own once the first
 * membership or payment lands in it. The season in progress is always included,
 * even before it has any data of its own, so the dashboard never opens on a
 * year that is missing from its own selector.
 */
export default async function getAdminYears(): Promise<number[]> {
	const [membershipYears, oldest, newest] = await Promise.all([
		prisma.userMembership.findMany({
			distinct: ["year"],
			select: { year: true },
		}),
		prisma.payment.findFirst({
			orderBy: { createdAt: "asc" },
			select: { createdAt: true },
		}),
		prisma.payment.findFirst({
			orderBy: { createdAt: "desc" },
			select: { createdAt: true },
		}),
	]);

	const years = new Set<number>([currentSeason()]);
	for (const { year } of membershipYears) {
		years.add(year);
	}
	// Every season between the first and last payment, so a year that took money
	// but sold no membership still shows up.
	if (oldest && newest) {
		const from = seasonForDate(oldest.createdAt);
		const to = seasonForDate(newest.createdAt);
		for (let year = from; year <= to; year++) {
			years.add(year);
		}
	}

	return [...years].sort((a, b) => b - a);
}
