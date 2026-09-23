import { describe, expect, it } from "vitest";
import { formatPaymentDay, groupPaymentsByDay } from "@/lib/payments";

const at = (iso: string) => ({ createdAt: new Date(iso) });

describe("groupPaymentsByDay", () => {
	it("returns nothing for a season with no payments", () => {
		expect(groupPaymentsByDay([])).toEqual([]);
	});

	it("collapses a day's payments into a single bar", () => {
		expect(
			groupPaymentsByDay([
				at("2026-03-04T09:00:00.000Z"),
				at("2026-03-04T17:30:00.000Z"),
			]),
		).toEqual([{ day: "2026-03-04", count: 2 }]);
	});

	it("orders oldest first, whatever order the rows arrive in", () => {
		// The query returns newest first, but a bar chart reads left to right.
		expect(
			groupPaymentsByDay([
				at("2026-03-04T09:00:00.000Z"),
				at("2025-12-29T09:00:00.000Z"),
				at("2026-01-15T09:00:00.000Z"),
			]).map((entry) => entry.day),
		).toEqual(["2025-12-29", "2026-01-15", "2026-03-04"]);
	});

	it("leaves quiet days out rather than filling them with zeros", () => {
		expect(
			groupPaymentsByDay([
				at("2026-01-01T09:00:00.000Z"),
				at("2026-01-04T09:00:00.000Z"),
			]),
		).toHaveLength(2);
	});

	it("puts a payment on the UTC day it was taken", () => {
		// Grouping replaces a `date_trunc` that ran in the database, so the day a
		// payment lands on must not follow the server's local offset.
		expect(groupPaymentsByDay([at("2026-01-01T00:00:00.000Z")])[0].day).toBe(
			"2026-01-01",
		);
		expect(groupPaymentsByDay([at("2026-01-01T23:59:59.999Z")])[0].day).toBe(
			"2026-01-01",
		);
	});
});

describe("formatPaymentDay", () => {
	it("labels a bar with the day its payments were grouped under", () => {
		expect(formatPaymentDay("2026-01-15")).toBe("Jan 15");
	});

	it("does not slip a day west of UTC", () => {
		// A date with no time parses as UTC midnight, so rendering it in the
		// viewer's own zone moved the label back a day anywhere behind UTC: the
		// bar built from 15 January's payments would have read "Jan 14". Invisible
		// to the club's Italian admins, wrong for anyone in the Americas.
		const previous = process.env.TZ;
		process.env.TZ = "America/New_York";
		try {
			expect(formatPaymentDay("2026-01-15")).toBe("Jan 15");
		} finally {
			process.env.TZ = previous;
		}
	});

	it("carries the year for the tooltip, which the axis drops", () => {
		// A season straddles December and January, so the two sit side by side.
		expect(formatPaymentDay("2025-12-29", true)).toBe("December 29, 2025");
		expect(formatPaymentDay("2026-01-02", true)).toBe("January 2, 2026");
	});
});
