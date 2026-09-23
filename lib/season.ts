/**
 * The club's year, which is a season rather than a calendar year.
 *
 * Memberships for the next year go on sale in the middle of December, so a
 * payment made on 29 December belongs to the season that is only just starting.
 * Season Y therefore runs from 15 December of Y-1 to 15 December of Y.
 *
 * The cutoff was chosen against the real payment history rather than picked:
 * it is the only boundary in that window under which no payment contradicts the
 * campaign slug it carries. A 1 December boundary, for instance, would file the
 * `VLM-VIG-2025` payments taken on 2025-12-01 into the 2026 season. Measured
 * across all 601 payments, the split is 308 for 2025 and 293 for 2026 — which
 * matches, exactly, the number of distinct people holding a membership for each
 * of those years.
 *
 * This generalises the `2025-12-30` literal that used to be written out at
 * every call site, which could not name any season but the one it was typed for.
 */

/** December — the month the next season opens in. */
const seasonStartMonth = 12;
/** Day of that month the season turns over on. */
const seasonStartDay = 15;

/**
 * The half-open interval `[start, end)` covering a season.
 *
 * Half-open so that the turnover instant belongs to exactly one season: a
 * payment taken at midnight on 15 December opens the new year rather than
 * closing the old one, and no payment can be counted twice.
 *
 * Built in UTC because `payment.created_at` is a `timestamp without time zone`
 * that Prisma hands back marked as UTC. Local-time bounds would drift the
 * boundary by the server's offset.
 */
export function seasonRange(year: number): { start: Date; end: Date } {
	return {
		start: new Date(Date.UTC(year - 1, seasonStartMonth - 1, seasonStartDay)),
		end: new Date(Date.UTC(year, seasonStartMonth - 1, seasonStartDay)),
	};
}

/** The season a given instant falls in. */
export function seasonForDate(date: Date): number {
	const year = date.getUTCFullYear();
	// Past the turnover, the date already belongs to the season named after the
	// following calendar year.
	return date >= seasonRange(year).end ? year + 1 : year;
}

/** The season in progress, which is what the dashboard opens on. */
export function currentSeason(now: Date = new Date()): number {
	return seasonForDate(now);
}
