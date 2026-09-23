import { afterEach, describe, expect, it } from "vitest";
import { formatRomeDateTime } from "@/lib/meteo-time";

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
