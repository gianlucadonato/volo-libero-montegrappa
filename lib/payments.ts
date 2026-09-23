/**
 * Shaping of payment rows for the dashboard charts.
 */

/** A day's payment count, as the bar chart consumes it. */
export type PaymentsPerDay = {
	/** `YYYY-MM-DD`, in UTC. */
	day: string;
	count: number;
};

/**
 * Counts payments per calendar day, oldest first.
 *
 * Done here rather than in SQL because the page has already read the rows for
 * the payment-method breakdown, so grouping them again in the database would be
 * a second round trip for a number already in memory. The result is identical:
 * `created_at` is a `timestamp without time zone` that Prisma returns marked as
 * UTC, which is the same instant Postgres would have truncated.
 *
 * Days with no payments are left out rather than filled with zeros, matching
 * what the chart previously received.
 */
export function groupPaymentsByDay(
	payments: readonly { createdAt: Date }[],
): PaymentsPerDay[] {
	const counts = new Map<string, number>();
	for (const payment of payments) {
		const day = payment.createdAt.toISOString().slice(0, 10);
		counts.set(day, (counts.get(day) ?? 0) + 1);
	}

	// The rows arrive newest first, and a bar chart reads left to right.
	return [...counts.entries()]
		.map(([day, count]) => ({ day, count }))
		.sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Renders a `day` key from {@link groupPaymentsByDay} for the chart.
 *
 * Built from the string's own parts rather than by parsing it into a `Date`:
 * a date with no time parses as UTC midnight, which renders as the day before
 * anywhere behind UTC, so a bar would be labelled with a day other than the one
 * its payments were grouped under. `timeZone` is pinned for the same reason.
 *
 * `withYear` is for the tooltip: the axis drops the year to stay legible, but a
 * season straddles December and January, so adjacent bars are otherwise
 * ambiguous.
 */
export function formatPaymentDay(day: string, withYear = false): string {
	const [year, month, date] = day.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-US", {
		day: "numeric",
		month: withYear ? "long" : "short",
		...(withYear && { year: "numeric" }),
		timeZone: "UTC",
	});
}
