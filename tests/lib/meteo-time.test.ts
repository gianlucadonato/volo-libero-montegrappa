import { afterEach, describe, expect, it } from "vitest";
import { formatRomeDateTime, romeHourToUtc } from "@/lib/meteo-time";

// 18:57:15 in Rome, 16:57:15 UTC — the pair from the bug report.
const at = new Date("2026-09-23T16:57:15.000Z");

const original = process.env.TZ;
afterEach(() => {
	process.env.TZ = original;
});

describe("formatRomeDateTime", () => {
	it("reads the same on a Rome laptop and a UTC container", () => {
		// The bug: the page formatted in the server's own zone, so a timestamp
		// that said 18:57 in development came out as 16:57 once deployed.
		process.env.TZ = "Europe/Rome";
		const local = formatRomeDateTime("it", at, { seconds: true });
		process.env.TZ = "UTC";
		const deployed = formatRomeDateTime("it", at, { seconds: true });

		expect(local).toBe(deployed);
		expect(deployed).toBe("23/09/2026 18:57:15");
	});

	it("holds even when the server sits the other side of the date line", () => {
		process.env.TZ = "Pacific/Auckland";
		expect(formatRomeDateTime("it", at, { seconds: true })).toBe(
			"23/09/2026 18:57:15",
		);
	});

	it("follows the reader's language for the date order", () => {
		// 23/09 and 09/23 are both readable dates and only the language says
		// which, so the order cannot stay pinned to the Italian one.
		expect(formatRomeDateTime("en", at)).toBe("09/23/2026 18:57");
		expect(formatRomeDateTime("it", at)).toBe("23/09/2026 18:57");
	});

	it("keeps a 24-hour clock in English too", () => {
		// The maps caption their own run hours in 24-hour time; an English
		// visitor shown "6:57 PM" beside them would be comparing two times that
		// do not look like the same one.
		expect(formatRomeDateTime("en", at)).not.toMatch(/[AP]M/i);
	});

	it("leaves the seconds off unless they are asked for", () => {
		expect(formatRomeDateTime("it", at)).toBe("23/09/2026 18:57");
	});

	it("takes the ISO string the forecasts action returns", () => {
		// `scrapedAt` crosses the server boundary as a string, `updatedAt` as a
		// Date; both reach this helper.
		expect(formatRomeDateTime("it", at.toISOString())).toBe(
			formatRomeDateTime("it", at),
		);
	});

	it("follows Italy off summer time", () => {
		// Rome is UTC+2 in September and UTC+1 in December; a fixed offset would
		// be an hour out for half the flying season.
		expect(formatRomeDateTime("it", new Date("2026-12-23T16:57:15.000Z"))).toBe(
			"23/12/2026 17:57",
		);
	});
});

describe("romeHourToUtc", () => {
	it("reads a table row's hour as the wall clock at the take-off", () => {
		// The rows carry no zone at all — just a day and an hour — and a pilot
		// reads them against their own watch, so 08:00 on this row is 06:00 UTC.
		expect(romeHourToUtc("2026-09-23", 8)?.toISOString()).toBe(
			"2026-09-23T06:00:00.000Z",
		);
	});

	it("follows Italy off summer time", () => {
		// Same hour of the table, two hours apart in UTC depending on the month.
		// A fixed offset would point at the wrong frame for half the season.
		expect(romeHourToUtc("2026-12-23", 8)?.toISOString()).toBe(
			"2026-12-23T07:00:00.000Z",
		);
	});

	it("uses the offset in force at the hour, not at the guess", () => {
		// The Sunday the clocks go back. 01:00 is still summer time and 04:00 is
		// already winter time, so a single-pass conversion — which reads the
		// offset at the guess rather than at the answer — is an hour out on one
		// of the two.
		expect(romeHourToUtc("2026-10-25", 1)?.toISOString()).toBe(
			"2026-10-24T23:00:00.000Z",
		);
		expect(romeHourToUtc("2026-10-25", 4)?.toISOString()).toBe(
			"2026-10-25T03:00:00.000Z",
		);
	});

	it("survives the hour that does not exist", () => {
		// 02:00 on the March Sunday is skipped by the clocks. The source
		// publishes no forecast at it, and a frame an hour either side is still
		// the right weather, so this resolves rather than failing.
		expect(romeHourToUtc("2026-03-29", 2)?.toISOString()).toBe(
			"2026-03-29T01:00:00.000Z",
		);
	});

	it("keeps the flying hours right across both changeover days", () => {
		// What actually matters: the tables only run 08:00-19:00, and those
		// hours are unambiguous on both Sundays.
		expect(romeHourToUtc("2026-03-29", 8)?.toISOString()).toBe(
			"2026-03-29T06:00:00.000Z",
		);
		expect(romeHourToUtc("2026-10-25", 8)?.toISOString()).toBe(
			"2026-10-25T07:00:00.000Z",
		);
	});

	it("rejects anything that is not a plain calendar day", () => {
		expect(romeHourToUtc("23/09/2026", 8)).toBeUndefined();
		expect(romeHourToUtc("2026-09-23T00:00:00Z", 8)).toBeUndefined();
		expect(romeHourToUtc("", 8)).toBeUndefined();
	});
});
