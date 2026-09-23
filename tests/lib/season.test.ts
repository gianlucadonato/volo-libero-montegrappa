import { describe, expect, it } from "vitest";
import { currentSeason, seasonForDate, seasonRange } from "@/lib/season";

describe("club season", () => {
	describe("seasonRange", () => {
		it("runs from mid-December of the previous year", () => {
			const { start, end } = seasonRange(2026);
			expect(start.toISOString()).toBe("2025-12-15T00:00:00.000Z");
			expect(end.toISOString()).toBe("2026-12-15T00:00:00.000Z");
		});

		it("hands the turnover instant to the season starting, not the one ending", () => {
			// Half-open, so a payment taken at the boundary is counted once. If both
			// ends were inclusive the same payment would appear in two years' totals.
			const turnover = seasonRange(2026).start;
			expect(seasonRange(2025).end.getTime()).toBe(turnover.getTime());
			expect(seasonForDate(turnover)).toBe(2026);
		});

		it("covers consecutive seasons without a gap", () => {
			expect(seasonRange(2025).end.getTime()).toBe(
				seasonRange(2026).start.getTime(),
			);
		});
	});

	describe("seasonForDate", () => {
		it("keeps the first half of December with the year that is ending", () => {
			expect(seasonForDate(new Date("2025-12-14T23:59:59.999Z"))).toBe(2025);
		});

		it("turns over on 15 December", () => {
			expect(seasonForDate(new Date("2025-12-15T00:00:00.000Z"))).toBe(2026);
		});

		it("files an early-December renewal under the season it was paid for", () => {
			// Real payments: two `VLM-VIG-2025` subscriptions taken on this date. A
			// 1 December cutoff would have misfiled them into the 2026 season.
			expect(seasonForDate(new Date("2025-12-01T00:00:00.000Z"))).toBe(2025);
		});

		it("files the opening of the next campaign under the new season", () => {
			// The 2026 campaign (`VLM26`) opened on this date.
			expect(seasonForDate(new Date("2025-12-29T00:00:00.000Z"))).toBe(2026);
		});

		it("names the season after the calendar year it mostly covers", () => {
			expect(seasonForDate(new Date("2026-01-01T00:00:00.000Z"))).toBe(2026);
			expect(seasonForDate(new Date("2026-08-06T00:00:00.000Z"))).toBe(2026);
		});

		it("handles a leap day, which sits mid-season", () => {
			expect(seasonForDate(new Date("2028-02-29T12:00:00.000Z"))).toBe(2028);
		});
	});

	describe("currentSeason", () => {
		it("reads the season from the given instant", () => {
			expect(currentSeason(new Date("2026-09-23T10:00:00.000Z"))).toBe(2026);
			expect(currentSeason(new Date("2026-12-20T10:00:00.000Z"))).toBe(2027);
		});
	});
});
