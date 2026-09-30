import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
	it("lowercases and dashes words", () => {
		expect(slugify("Benvenuti nella sezione News")).toBe(
			"benvenuti-nella-sezione-news",
		);
	});

	it("strips accents and emoji", () => {
		expect(slugify("🪂 PARTE IL BREVETTO XC! Sarà già così")).toBe(
			"parte-il-brevetto-xc-sara-gia-cosi",
		);
	});

	it("returns an empty string when nothing is left", () => {
		expect(slugify("🪂 🏔️")).toBe("");
	});

	it("caps the length without a trailing dash", () => {
		const slug = slugify(`${"a".repeat(79)} bbb`);
		expect(slug).toBe("a".repeat(79));
		expect(slugify("x".repeat(200)).length).toBe(80);
	});
});
