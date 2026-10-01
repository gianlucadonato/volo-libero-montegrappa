// Shared, client-safe pieces of the live map: types, map defaults and the
// pure helpers that turn the EasyXCScore OGN feed into map aircraft. The
// server-only upstream calls live in lib/live-map-server.ts.

// Area covered by the map: the Monte Grappa flying area, the same centre and
// radius the club map on EasyXCScore uses.
export const LIVE_MAP_CENTER = { lat: 45.8177, lon: 11.7716 } as const;
export const LIVE_MAP_RADIUS_DEG = 0.9;
// Beacons above this altitude are airliners, not free flight.
export const LIVE_MAP_MAX_ALT_M = 6000;
// How far back the recorded tracks go.
export const LIVE_MAP_HISTORY_MS = 8 * 60 * 60 * 1000;

export type LiveMapScope = "all" | "members";

export type TrackPoint = {
	ts: number;
	lat: number;
	lon: number;
	alt: number;
	spd: number;
	hdg: number;
	vz: number;
};

export type LiveAircraft = TrackPoint & {
	id: string;
	// The key EasyXCScore stores this aircraft's recorded track under.
	historyKey: string;
	label: string;
	name: string | null;
	member: boolean;
	source: string;
};

export type LiveMapMember = {
	name: string;
	ognCallsign: string | null;
	ognHex: string | null;
};

export type LiveSos = {
	id: string;
	name: string | null;
	keys: string[];
	lat: number;
	lon: number;
	alt: number | null;
	ts: number | null;
	trail: [number, number][];
};

// Tracker prefixes the OGN network puts in front of a device id, so that
// FLR3E0F21 and 3E0F21 name the same device. Same list as EasyXCScore's
// normalizeCallsign(), so both sides match beacons the same way.
const CALLSIGN_PREFIXES = [
	"FLR",
	"OGN",
	"ICA",
	"FNT",
	"PAW",
	"TRK",
	"SPO",
	"SKY",
	"FLY",
	"CAP",
	"NAV",
	"SPD",
	"NMO",
	"LT",
	"EAS",
];

export function normalizeCallsign(callsign: string) {
	const upper = callsign.toUpperCase().trim();
	for (const prefix of CALLSIGN_PREFIXES) {
		if (upper.startsWith(prefix) && upper.length > prefix.length) {
			return upper.slice(prefix.length);
		}
	}
	return upper;
}

// Every spelling a callsign can be matched by: as typed and without its
// tracker prefix.
function callsignKeys(callsign: string | null | undefined) {
	const value = callsign?.trim();
	if (!value) return [];
	return [...new Set([value.toUpperCase(), normalizeCallsign(value)])];
}

export function memberKeys(member: LiveMapMember) {
	return [
		...new Set([
			...callsignKeys(member.ognCallsign),
			...callsignKeys(member.ognHex),
		]),
	];
}

// The keys EasyXCScore may have recorded a member's track under: the app
// callsign, the bare hex id, or the hex id behind a FLARM/OGN prefix.
export function memberHistoryKeys(member: LiveMapMember) {
	const keys = new Set<string>();
	const callsign = member.ognCallsign?.trim().toUpperCase();
	const hex = member.ognHex?.trim().toUpperCase();
	if (callsign) keys.add(callsign);
	if (hex) {
		keys.add(hex);
		keys.add(`FLR${hex}`);
		keys.add(`OGN${hex}`);
	}
	return [...keys].filter((key) => /^[A-Z0-9-]{2,16}$/.test(key));
}

// A stable id for a member, so their live beacon and their recorded track land
// on the same map aircraft whichever callsign either was keyed by.
export function memberAircraftId(member: LiveMapMember) {
	return `member:${memberKeys(member)[0] ?? member.name}`;
}

export function memberDisplayCallsign(member: LiveMapMember) {
	return member.ognCallsign?.trim() || member.ognHex?.trim() || "";
}

export type MemberIndex = Map<string, LiveMapMember>;

export function buildMemberIndex(members: LiveMapMember[]): MemberIndex {
	const index: MemberIndex = new Map();
	for (const member of members) {
		for (const key of memberKeys(member)) {
			if (!index.has(key)) index.set(key, member);
		}
	}
	return index;
}

export function findMember(
	index: MemberIndex,
	...callsigns: (string | null | undefined)[]
) {
	for (const callsign of callsigns) {
		for (const key of callsignKeys(callsign)) {
			const member = index.get(key);
			if (member) return member;
		}
	}
	return null;
}

// A beacon as /api/ogn/proxy/livedata returns it. Real-time APRS beacons carry
// `ts`; the OGN snapshot ones only carry their age.
export type UpstreamPosition = {
	id?: string;
	callsign?: string;
	display_callsign?: string | null;
	lat?: number;
	lon?: number;
	alt_m?: number | null;
	heading?: number | null;
	speed_kmh?: number | null;
	vspeed_ms?: number | null;
	source?: string | null;
	ts?: string | null;
	age_s?: number | null;
};

function num(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function beaconTime(position: UpstreamPosition, now: number) {
	if (position.ts) {
		const ts = Date.parse(position.ts);
		if (Number.isFinite(ts)) return ts;
	}
	return now - num(position.age_s) * 1000;
}

export function toLiveAircraft(
	position: UpstreamPosition,
	index: MemberIndex,
	now: number,
): LiveAircraft | null {
	const callsign = (position.callsign || position.id || "").trim();
	if (!callsign) return null;
	if (!Number.isFinite(position.lat) || !Number.isFinite(position.lon)) {
		return null;
	}
	const alt = num(position.alt_m);
	if (alt > LIVE_MAP_MAX_ALT_M) return null;

	const display = position.display_callsign?.trim() || callsign;
	const member = findMember(index, callsign, display);
	return {
		id: member ? memberAircraftId(member) : callsign.toUpperCase(),
		historyKey: callsign.toUpperCase(),
		label: member ? memberDisplayCallsign(member) || display : display,
		name: member?.name ?? null,
		member: Boolean(member),
		source: position.source || "ogn",
		ts: beaconTime(position, now),
		lat: position.lat as number,
		lon: position.lon as number,
		alt,
		spd: num(position.speed_kmh),
		hdg: num(position.heading),
		vz: num(position.vspeed_ms),
	};
}

// A point as /api/ogn/history/:callsign returns it.
export type UpstreamTrackPoint = {
	ts?: string;
	lat?: number;
	lon?: number;
	alt_m?: number | null;
	speed_kmh?: number | null;
	heading?: number | null;
	vspeed_ms?: number | null;
};

export function toTrackPoints(points: UpstreamTrackPoint[]): TrackPoint[] {
	const track: TrackPoint[] = [];
	for (const point of points) {
		const ts = point.ts ? Date.parse(point.ts) : Number.NaN;
		if (!Number.isFinite(ts)) continue;
		if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) continue;
		track.push({
			ts,
			lat: point.lat as number,
			lon: point.lon as number,
			alt: num(point.alt_m),
			spd: num(point.speed_kmh),
			hdg: num(point.heading),
			vz: num(point.vspeed_ms),
		});
	}
	return track.sort((a, b) => a.ts - b.ts);
}
