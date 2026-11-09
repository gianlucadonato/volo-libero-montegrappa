import { describe, expect, it } from "vitest";
import {
	parseWindDirections,
	translateWindDirection,
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

describe("translateWindDirection", () => {
	const en = {
		nord: "north",
		sud: "south",
		est: "east",
		ovest: "west",
	} as const;

	it("swaps each word and keeps the separators", () => {
		expect(
			translateWindDirection("sud - sud/est - sud/ovest", (w) => en[w]),
		).toBe("south - south/east - south/west");
		expect(translateWindDirection("Sud", (w) => en[w])).toBe("south");
		expect(translateWindDirection("sud/sud est", (w) => en[w])).toBe(
			"south/south east",
		);
	});
});
