import { describe, expect, it } from "vitest";
import {
	defaultQuadrantMaps,
	elmeteoMaps,
	elmeteoSiteLegend,
	getElmeteoMap,
	isElmeteoMapId,
	quadrantCount,
} from "@/lib/elmeteo-maps";

describe("elmeteo map catalogue", () => {
	it("has unique ids", () => {
		const ids = elmeteoMaps.map((map) => map.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("excludes the broken nubi map", () => {
		// The source publishes it, but every frame is a black placeholder.
		expect(isElmeteoMapId("nubi")).toBe(false);
	});

	it("labels the misleading stems by what the image actually shows", () => {
		expect(getElmeteoMap("term950").label).toContain("500-1500");
		expect(getElmeteoMap("term850").label).toContain("1500");
		expect(getElmeteoMap("temp850").description).toContain("850 hPa");
		expect(getElmeteoMap("thetae850").description).toContain("THETA_E");
	});

	it("fills every quadrant with a known map", () => {
		expect(defaultQuadrantMaps).toHaveLength(quadrantCount);
		for (const map of defaultQuadrantMaps) {
			expect(isElmeteoMapId(map)).toBe(true);
		}
	});

	it("gives every map something to show under the enlarged image", () => {
		// The dialog renders `details` unconditionally: a map with no paragraph
		// would leave an empty block under the image.
		for (const map of elmeteoMaps) {
			expect(map.details.paragraphs.length).toBeGreaterThan(0);
			for (const paragraph of map.details.paragraphs) {
				expect(paragraph.trim()).not.toBe("");
			}
		}
	});

	it("keeps the site legend on the maps that print it", () => {
		expect(elmeteoSiteLegend).toHaveLength(7);
		// hbas_sc introduces the legend with its red note, so it must carry it.
		expect(getElmeteoMap("hbas_sc").details.sites).toBe(true);
		expect(getElmeteoMap("turb").details.sites).toBeUndefined();
	});

	it("rejects unknown ids, including path traversal attempts", () => {
		expect(isElmeteoMapId("../../secret")).toBe(false);
		expect(isElmeteoMapId("")).toBe(false);
	});
});
