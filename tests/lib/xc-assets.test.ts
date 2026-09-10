import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
	env: { AWS_S3_XC_PUBLIC_BUCKET: "vlm-xc-public" },
}));

import { XC_PUBLIC_ASSETS_BASE_URL } from "@/config/constants";
import {
	getXcPublicBucket,
	xcAssetObjectKey,
	xcAssetUrl,
} from "@/lib/xc-assets";

describe("xcAssetObjectKey", () => {
	// Both forms must work: rows hold root-relative paths until the URL
	// migration runs, and absolute bucket URLs afterwards.
	it("resolves a root-relative path", () => {
		expect(xcAssetObjectKey("/xcmontegrappa/basic/01/b01.tsk")).toBe(
			"xcmontegrappa/basic/01/b01.tsk",
		);
	});

	it("resolves an absolute bucket URL", () => {
		expect(
			xcAssetObjectKey(
				`${XC_PUBLIC_ASSETS_BASE_URL}/xcmontegrappa/basic/01/b01.tsk`,
			),
		).toBe("xcmontegrappa/basic/01/b01.tsk");
	});

	it("decodes percent-escapes from the old QR folder name", () => {
		expect(xcAssetObjectKey("/xcmontegrappa/QR%20Code/B01.jpg")).toBe(
			"xcmontegrappa/QR Code/B01.jpg",
		);
	});

	it("strips a query string", () => {
		expect(xcAssetObjectKey("/xcmontegrappa/basic/01/b01.tsk?v=2")).toBe(
			"xcmontegrappa/basic/01/b01.tsk",
		);
	});

	it.each([
		["null", null],
		["undefined", undefined],
		["empty", ""],
		["outside the prefix", "/uploads/2026/secret.igc"],
		["absolute URL outside the prefix", "https://evil.example.com/x.png"],
		["plain traversal", "/xcmontegrappa/../uploads/secret.igc"],
		["encoded traversal", "/xcmontegrappa/%2E%2E/uploads/secret.igc"],
		["malformed escape", "/xcmontegrappa/%ZZ.png"],
	])("returns null for %s", (_label, url) => {
		expect(xcAssetObjectKey(url)).toBeNull();
	});
});

describe("xcAssetUrl", () => {
	it("builds an absolute URL from a key", () => {
		expect(xcAssetUrl("xcmontegrappa/qr-codes/B01.jpg")).toBe(
			`${XC_PUBLIC_ASSETS_BASE_URL}/xcmontegrappa/qr-codes/B01.jpg`,
		);
	});
});

describe("getXcPublicBucket", () => {
	it("returns the configured bucket", () => {
		expect(getXcPublicBucket()).toBe("vlm-xc-public");
	});
});
