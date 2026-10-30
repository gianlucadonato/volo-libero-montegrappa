import { describe, expect, it } from "vitest";
import { xcSeasonBounds, xcSeasonRange, xcSeasonYear } from "@/lib/xc-season";

describe("xcSeasonYear", () => {
	it("is the current year up to 30 September", () => {
		expect(xcSeasonYear(new Date("2026-01-01T00:00:00Z"))).toBe(2026);
		expect(xcSeasonYear(new Date("2026-09-30T23:59:59Z"))).toBe(2026);
	});

	it("rolls over to the next year on 1 October", () => {
		expect(xcSeasonYear(new Date("2026-10-01T00:00:00Z"))).toBe(2027);
		expect(xcSeasonYear(new Date("2026-12-31T23:59:59Z"))).toBe(2027);
	});
});

describe("xcSeasonBounds", () => {
	it("spans 1 Oct of the previous year to 30 Sep, at day precision", () => {
		const { start, end } = xcSeasonBounds(2027);
		expect(start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
		expect(end.toISOString()).toBe("2027-09-30T00:00:00.000Z");
	});
});

describe("xcSeasonRange", () => {
	it("ends at the last instant of 30 Sep", () => {
		const { startsAt, endsAt } = xcSeasonRange(2027);
		expect(startsAt.toISOString()).toBe("2026-10-01T00:00:00.000Z");
		expect(endsAt.toISOString()).toBe("2027-09-30T23:59:59.999Z");
	});

	it("matches the season year at both ends", () => {
		const { startsAt, endsAt } = xcSeasonRange(2027);
		expect(xcSeasonYear(startsAt)).toBe(2027);
		expect(xcSeasonYear(endsAt)).toBe(2027);
	});
});
