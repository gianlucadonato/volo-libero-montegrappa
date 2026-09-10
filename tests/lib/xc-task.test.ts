import { describe, expect, it } from "vitest";
import { XC_PUBLIC_ASSETS_BASE_URL } from "@/config/constants";
import { qrCodeUrlForTask } from "@/lib/xc-task";

const QR_BASE = `${XC_PUBLIC_ASSETS_BASE_URL}/xcmontegrappa/qr-codes`;

describe("qrCodeUrlForTask", () => {
	// QR files are per-category (01..10) while slugs are globally numbered, so
	// the number has to be re-based and the letter comes from the category.
	it.each([
		["BASIC", "B1", "B01"],
		["BASIC", "B10", "B10"],
		["INTERMEDIATE", "S11", "I01"],
		["INTERMEDIATE", "S20", "I10"],
		["ADVANCED", "G21", "A01"],
		["ADVANCED", "G30", "A10"],
	])("maps %s/%s to %s.jpg", (category, slug, expected) => {
		expect(qrCodeUrlForTask(category, slug)).toBe(`${QR_BASE}/${expected}.jpg`);
	});

	it("accepts a lowercase category", () => {
		expect(qrCodeUrlForTask("basic", "B1")).toBe(`${QR_BASE}/B01.jpg`);
	});

	it("returns an absolute URL with no %20 escape", () => {
		const url = qrCodeUrlForTask("BASIC", "B1");
		expect(url).toMatch(/^https:\/\//);
		expect(url).not.toContain("%20");
	});

	it.each([
		["missing category", null, "B1"],
		["missing slug", "BASIC", null],
		["unknown category", "EXPERT", "B1"],
		["slug with no digits", "BASIC", "B"],
		["zero index", "BASIC", "B0"],
	])("returns null for %s", (_label, category, slug) => {
		expect(qrCodeUrlForTask(category, slug)).toBeNull();
	});
});
