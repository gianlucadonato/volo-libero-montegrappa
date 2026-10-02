import "server-only";

import { NEXT_YEAR } from "@/config/constants";
import {
	buildMemberIndex,
	LIVE_MAP_CENTER,
	LIVE_MAP_HISTORY_MS,
	LIVE_MAP_RADIUS_DEG,
	type LiveAircraft,
	type LiveMapMember,
	type LiveSos,
	memberHistoryKeys,
	type TrackPoint,
	toLiveAircraft,
	toTrackPoints,
	type UpstreamPosition,
	type UpstreamTrackPoint,
} from "@/lib/live-map";
import { prisma } from "@/lib/prisma";

// The OGN data comes from EasyXCScore, which keeps a persistent APRS-IS
// connection to the OGN network, records every beacon in the area and merges
// the EXTK tracker app in. This site holds no tracking state of its own: it
// proxies those public endpoints and adds who is a club member.
const EASYXCSCORE_URL = "https://easyxcscore.com";
const UPSTREAM_TIMEOUT_MS = 8000;
// Members change rarely; positions are polled every few seconds.
const MEMBERS_TTL_MS = 5 * 60 * 1000;

async function fetchUpstream<T>(path: string): Promise<T> {
	const response = await fetch(`${EASYXCSCORE_URL}${path}`, {
		cache: "no-store",
		signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
	});
	if (!response.ok) {
		throw new Error(`EasyXCScore ${path} answered ${response.status}`);
	}
	return (await response.json()) as T;
}

let membersCache: { at: number; members: LiveMapMember[] } | null = null;

// Current-year members who entered an OGN callsign or FLARM hex id in their
// profile: the pilots the "members" filter shows.
export async function getLiveMapMembers(): Promise<LiveMapMember[]> {
	if (membersCache && Date.now() - membersCache.at < MEMBERS_TTL_MS) {
		return membersCache.members;
	}
	const users = await prisma.user.findMany({
		where: {
			deletedAt: null,
			memberships: { some: { year: NEXT_YEAR } },
			OR: [{ ognCallsign: { not: null } }, { ognHex: { not: null } }],
		},
		select: {
			firstName: true,
			lastName: true,
			ognCallsign: true,
			ognHex: true,
		},
	});
	const members = users
		.map((user) => ({
			name: `${user.firstName} ${user.lastName}`.trim(),
			ognCallsign: user.ognCallsign?.trim() || null,
			ognHex: user.ognHex?.trim() || null,
		}))
		.filter((member) => member.ognCallsign || member.ognHex);
	membersCache = { at: Date.now(), members };
	return members;
}

export async function getLiveAircraft(): Promise<LiveAircraft[]> {
	const query = new URLSearchParams({
		lat: String(LIVE_MAP_CENTER.lat),
		lng: String(LIVE_MAP_CENTER.lon),
		radius: String(LIVE_MAP_RADIUS_DEG),
	});
	const [feed, members] = await Promise.all([
		fetchUpstream<{ positions?: UpstreamPosition[] }>(
			`/api/ogn/proxy/livedata?${query}`,
		),
		getLiveMapMembers(),
	]);
	const index = buildMemberIndex(members);
	const now = Date.now();
	return (feed.positions ?? [])
		.map((position) => toLiveAircraft(position, index, now))
		.filter((aircraft): aircraft is LiveAircraft => aircraft !== null);
}

async function fetchTrack(key: string, since: string) {
	const data = await fetchUpstream<{ points?: UpstreamTrackPoint[] }>(
		`/api/ogn/history/${encodeURIComponent(key)}?since=${encodeURIComponent(since)}`,
	);
	return toTrackPoints(data.points ?? []);
}

export async function getAircraftTrack(key: string): Promise<TrackPoint[]> {
	const since = new Date(Date.now() - LIVE_MAP_HISTORY_MS).toISOString();
	return fetchTrack(key, since);
}

// The recorded track of every member, including those out of signal now, so
// the "out of signal" list can show where they were last seen.
export async function getMemberTracks() {
	const members = await getLiveMapMembers();
	const since = new Date(Date.now() - LIVE_MAP_HISTORY_MS).toISOString();
	const tracks = await Promise.all(
		members.map(async (member) => {
			for (const key of memberHistoryKeys(member)) {
				const points = await fetchTrack(key, since).catch(() => []);
				if (points.length) return { member, key, points };
			}
			return null;
		}),
	);
	return tracks.filter((track) => track !== null);
}

type UpstreamSos = {
	id: number | string;
	hex_id?: string | null;
	pilot_name?: string | null;
	callsign?: string | null;
	lat?: number;
	lon?: number;
	alt_m?: number | null;
	ts?: string | null;
	trail?: [number, number][];
};

// Free-flight SOS alerts raised from the EXTK app, open until resolved.
export async function getActiveSos(): Promise<LiveSos[]> {
	const data = await fetchUpstream<{ ok?: boolean; sos?: UpstreamSos[] }>(
		"/api/tracker/sos-active",
	);
	return (data.sos ?? [])
		.filter((sos) => Number.isFinite(sos.lat) && Number.isFinite(sos.lon))
		.map((sos) => ({
			id: String(sos.id),
			name: sos.pilot_name || sos.callsign || sos.hex_id || null,
			keys: [sos.hex_id, sos.callsign]
				.filter((key): key is string => Boolean(key))
				.map((key) => key.toUpperCase()),
			lat: sos.lat as number,
			lon: sos.lon as number,
			alt: typeof sos.alt_m === "number" ? sos.alt_m : null,
			ts: sos.ts ? Date.parse(sos.ts) : null,
			trail: Array.isArray(sos.trail) ? sos.trail : [],
		}));
}
