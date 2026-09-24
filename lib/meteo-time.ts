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

/**
 * Europe/Rome's offset from UTC at a given instant, in milliseconds.
 *
 * Derived from `Intl` rather than hardcoded, so the +1/+2 switch at the end of
 * October is handled without a DST table of our own.
 */
export function romeOffsetMs(at: Date) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: ROME_TIME_ZONE,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).formatToParts(at);

	const value = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((part) => part.type === type)?.value);

	const asUtc = Date.UTC(
		value("year"),
		value("month") - 1,
		value("day"),
		value("hour"),
		value("minute"),
		value("second"),
	);

	return asUtc - at.getTime();
}

const dayPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The UTC instant of a wall-clock hour in the flying zone.
 *
 * The forecast tables are keyed by `(day, hour)` as the source publishes them —
 * a local date and a local hour, with no zone anywhere in the row — while the
 * map frames are keyed by a UTC instant. This is the conversion between the
 * two, and it is what lets an hour of the table name a frame.
 *
 * Solved in two passes rather than by adding a fixed offset: the offset that
 * applies is the one at the *answer*, not the one at the guess, and on the two
 * changeover days those differ. The first pass lands within an hour of the
 * instant, which is close enough for the second to read the right offset.
 *
 * The hour that does not exist (02:00 on the March Sunday) and the one that
 * happens twice (in October) resolve to a neighbouring instant rather than
 * failing: the source publishes no forecast at either, and a map frame an hour
 * either side is still the right weather.
 */
export function romeHourToUtc(day: string, hour: number) {
	const match = dayPattern.exec(day);
	if (!match) {
		return undefined;
	}

	const [, year, month, date] = match;
	const asUtc = Date.UTC(Number(year), Number(month) - 1, Number(date), hour);

	const firstPass = asUtc - romeOffsetMs(new Date(asUtc));
	return new Date(asUtc - romeOffsetMs(new Date(firstPass)));
}
