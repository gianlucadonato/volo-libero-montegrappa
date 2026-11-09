import { describe, expect, it } from "vitest";
import {
	formatWindDirection,
	parseWindDirections,
} from "@/lib/wind-directions";

describe("parseWindDirections", () => {
	it.each([
		// The take-offs' real "Direzione vento" values.
		["Sud", ["S"]],
		["sud - sud/est - sud/ovest", ["SE", "S", "SW"]],
		["est - sud/est", ["E", "SE"]],
		["ovest - sud/ovest", ["SW", "W"]],
		["sud - sud/ovest", ["S", "SW"]],
		["est - sud/est - ovest", ["E", "SE", "W"]],
		["est", ["E"]],
	])("reads %j", (text, expected) => {
		expect(parseWindDirections(text)).toEqual(expected);
	});

	it("lights both neighbours of a 16-point direction", () => {
		expect(parseWindDirections("sud/sud est")).toEqual(["SE", "S"]);
		expect(parseWindDirections("nord/nord ovest")).toEqual(["N", "NW"]);
	});

	it("does not take 'est' inside 'ovest'", () => {
		expect(parseWindDirections("ovest")).toEqual(["W"]);
	});

	it("ignores what it cannot read", () => {
		expect(parseWindDirections("")).toEqual([]);
		expect(parseWindDirections("variabile")).toEqual([]);
	});
});

describe("formatWindDirection", () => {
	it.each([
		["Sud", "S"],
		["sud - sud/est - sud/ovest", "S - SE - SW"],
		["est - sud/est", "E - SE"],
		["ovest - sud/ovest", "W - SW"],
		["est - sud/est - ovest", "E - SE - W"],
		["sud/sud est", "SSE"],
		["nord/nord est", "NNE"],
	])("abbreviates %j as %j", (text, expected) => {
		expect(formatWindDirection(text)).toBe(expected);
	});

	it("keeps a part it cannot read", () => {
		expect(formatWindDirection("sud - variabile")).toBe("S - variabile");
	});
});
