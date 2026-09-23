/**
 * Wall-clock formatting for the /meteo pages.
 *
 * Every timestamp these pages show is a UTC instant — an upload time, a scrape
 * time — that a pilot reads against their own watch. `date-fns` renders in
 * whatever zone the process runs in, which is Europe/Rome on a laptop but UTC
 * in the container, so the same instant printed as 18:57 in development came
 * out as 16:57 in production. Pinning the zone is what makes the two agree.
 *
 * Europe/Rome rather than the viewer's own zone: this is the flying zone, the
 * one the forecasts describe and the one every pilot reading them is standing
 * in. `TimeControls` pins the timeline to it for the same reason.
 *
 * Not to be confused with `formatRunHour` on the maps page, which stays in UTC
 * on purpose so it matches the "Run ... UTC" caption burned into the images.
 */
export const ROME_TIME_ZONE = "Europe/Rome";

/**
 * A date the reader's language can parse: 23/09/2026 in Italian, 09/23/2026 in
 * English, since both orders are readable and only the language says which.
 */
function romeDate(locale: string) {
	return new Intl.DateTimeFormat(locale, {
		timeZone: ROME_TIME_ZONE,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

/**
 * The clock, forced to 24 hours in both languages so it reads like the maps'
 * own captions rather than turning into "6:57 PM" for English visitors.
 */
function romeTime(locale: string, withSeconds: boolean) {
	return new Intl.DateTimeFormat(locale, {
		timeZone: ROME_TIME_ZONE,
		hourCycle: "h23",
		hour: "2-digit",
		minute: "2-digit",
		...(withSeconds ? { second: "2-digit" } : {}),
	});
}

/** Date and time in the flying zone, whatever zone the server keeps. */
export function formatRomeDateTime(
	locale: string,
	at: Date | string,
	{ seconds = false }: { seconds?: boolean } = {},
) {
	const date = typeof at === "string" ? new Date(at) : at;
	return `${romeDate(locale).format(date)} ${romeTime(locale, seconds).format(date)}`;
}
