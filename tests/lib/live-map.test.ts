import { describe, expect, it } from "vitest";
import {
	playbackAt,
	pushPoint,
	toDMS,
} from "@/components/live-map/live-map-geo";
import {
	buildMemberIndex,
	findMember,
	LIVE_MAP_MAX_ALT_M,
	memberAircraftId,
	memberHistoryKeys,
	normalizeCallsign,
	type TrackPoint,
	toLiveAircraft,
	toTrackPoints,
} from "@/lib/live-map";

const members = [
	{ name: "Mario Rossi", ognCallsign: "BBK01", ognHex: "75ccde" },
	{ name: "Anna Bianchi", ognCallsign: null, ognHex: "FLR2C74AF" },
];

function point(ts: number, lat = 45.8, lon = 11.7): TrackPoint {
	return { ts, lat, lon, alt: 1000, spd: 30, hdg: 90, vz: 0 };
}

describe("normalizeCallsign", () => {
	it("strips the tracker prefix", () => {
		expect(normalizeCallsign("FLR3E0F21")).toBe("3E0F21");
		expect(normalizeCallsign("navfd1470")).toBe("FD1470");
	});

	it("keeps a callsign without a prefix", () => {
		expect(normalizeCallsign(" bbk01 ")).toBe("BBK01");
	});
});

describe("member matching", () => {
	const index = buildMemberIndex(members);

	it("matches the callsign or the hex id, with or without a prefix", () => {
		expect(findMember(index, "BBK01")?.name).toBe("Mario Rossi");
		expect(findMember(index, "FLR75CCDE")?.name).toBe("Mario Rossi");
		expect(findMember(index, "2c74af")?.name).toBe("Anna Bianchi");
		expect(findMember(index, "OGN2C74AF")?.name).toBe("Anna Bianchi");
	});

	it("does not match strangers", () => {
		expect(findMember(index, "NAVFD0E77", null)).toBeNull();
	});

	it("lists the keys a member's track can be recorded under", () => {
		expect(memberHistoryKeys(members[0])).toEqual([
			"BBK01",
			"75CCDE",
			"FLR75CCDE",
			"OGN75CCDE",
		]);
	});
});

describe("toLiveAircraft", () => {
	const index = buildMemberIndex(members);
	const now = Date.parse("2026-10-01T12:00:00Z");

	it("flags a member and uses their stable id", () => {
		const aircraft = toLiveAircraft(
			{ callsign: "FLR75CCDE", lat: 45.8, lon: 11.7, alt_m: 1500, age_s: 10 },
			index,
			now,
		);
		expect(aircraft).toMatchObject({
			id: memberAircraftId(members[0]),
			historyKey: "FLR75CCDE",
			label: "BBK01",
			name: "Mario Rossi",
			member: true,
			ts: now - 10_000,
		});
	});

	it("keeps a stranger under their callsign", () => {
		const aircraft = toLiveAircraft(
			{
				callsign: "NAVFD0E77",
				lat: 45.8,
				lon: 11.7,
				ts: "2026-10-01T11:59:00Z",
			},
			index,
			now,
		);
		expect(aircraft).toMatchObject({
			id: "NAVFD0E77",
			member: false,
			name: null,
			ts: Date.parse("2026-10-01T11:59:00Z"),
		});
	});

	it("drops airliners and beacons without a position", () => {
		expect(
			toLiveAircraft(
				{ callsign: "HB-IJU", lat: 46, lon: 12, alt_m: LIVE_MAP_MAX_ALT_M + 1 },
				index,
				now,
			),
		).toBeNull();
		expect(toLiveAircraft({ callsign: "X1" }, index, now)).toBeNull();
	});
});

describe("toTrackPoints", () => {
	it("sorts the points and skips the unusable ones", () => {
		const track = toTrackPoints([
			{ ts: "2026-10-01T12:01:00Z", lat: 45.81, lon: 11.71 },
			{ ts: "garbage", lat: 45.8, lon: 11.7 },
			{ ts: "2026-10-01T12:00:00Z", lat: 45.8, lon: 11.7, alt_m: 900 },
		]);
		expect(track.map((p) => p.lat)).toEqual([45.8, 45.81]);
		expect(track[0].alt).toBe(900);
	});
});

describe("pushPoint", () => {
	it("keeps the track sorted and drops duplicates", () => {
		const track: TrackPoint[] = [];
		pushPoint(track, point(2000, 45.81));
		pushPoint(track, point(1000, 45.8));
		expect(pushPoint(track, point(2000, 45.82))).toBe(false);
		// The same fix polled again with a drifted timestamp.
		expect(pushPoint(track, point(3000, 45.81))).toBe(false);
		expect(track.map((p) => p.ts)).toEqual([1000, 2000]);
	});
});

describe("playbackAt", () => {
	const track = [point(0, 45.8, 11.7), point(10_000, 45.9, 11.8)];

	it("interpolates between two beacons", () => {
		const state = playbackAt(track, 5000);
		expect(state?.lat).toBeCloseTo(45.85);
		expect(state?.lon).toBeCloseTo(11.75);
		expect(state?.opacity).toBe(1);
	});

	it("fades out after the last beacon, then hides", () => {
		expect(playbackAt(track, 40_000)?.opacity).toBeCloseTo(0.5);
		expect(playbackAt(track, 80_000)).toBeNull();
	});

	it("shows nothing before the first beacon", () => {
		expect(playbackAt(track, -1)).toBeNull();
	});
});

describe("toDMS", () => {
	it("formats latitude and longitude", () => {
		expect(toDMS(45.8177, true)).toBe(`45°49'04"N`);
		expect(toDMS(11.7716, false)).toBe(`011°46'18"E`);
	});
});
