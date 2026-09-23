import { describe, expect, it } from "vitest";
import { groupPaymentsByDay } from "@/lib/payments";

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
