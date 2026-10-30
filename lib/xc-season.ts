// An XC Montegrappa season runs from 1 October to 30 September of the following
// year and is named after the year it ends in: season 2027 is 1 Oct 2026 – 30 Sep
// 2027, and its XcEdition has id 2027. This is unrelated to the membership year
// (NEXT_YEAR), which turns over in mid-December.
//
// Boundaries are in UTC, like the IGC flight dates they are compared against.
// Pure and dependency-free so client components can import it too.

const SEASON_START_MONTH = 9; // October (0-based)

export function xcSeasonYear(date: Date = new Date()): number {
	const year = date.getUTCFullYear();
	return date.getUTCMonth() >= SEASON_START_MONTH ? year + 1 : year;
}

// First and last day of a season, both at 00:00 UTC, for inclusive day-level checks.
export function xcSeasonBounds(year: number): { start: Date; end: Date } {
	return {
		start: new Date(Date.UTC(year - 1, SEASON_START_MONTH, 1)),
		end: new Date(Date.UTC(year, SEASON_START_MONTH - 1, 30)),
	};
}

// Exact instants stored on XcEdition.startsAt / endsAt.
export function xcSeasonRange(year: number): { startsAt: Date; endsAt: Date } {
	return {
		startsAt: new Date(Date.UTC(year - 1, SEASON_START_MONTH, 1)),
		endsAt: new Date(
			Date.UTC(year, SEASON_START_MONTH - 1, 30, 23, 59, 59, 999),
		),
	};
}
