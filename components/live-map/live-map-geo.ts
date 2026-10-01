import type { TrackPoint } from "@/lib/live-map";

// Positions are replayed this far behind real time, so the marker can glide
// between two beacons instead of jumping when the next one arrives (OGN
// beacons come every 20-30 s).
export const PLAYBACK_DELAY_MS = 60_000;
// After its last beacon an aircraft fades out over this long, then moves to the
// "out of signal" list.
export const FADE_OUT_MS = 60_000;

// Inserts a point keeping the track sorted by time. A point at the same time,
// or the same fix seen again a moment later, is a duplicate: the OGN snapshot
// only gives an age, so a beacon polled twice comes back with a slightly
// different timestamp.
export function pushPoint(track: TrackPoint[], point: TrackPoint) {
	let lo = 0;
	let hi = track.length;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (track[mid].ts < point.ts) lo = mid + 1;
		else hi = mid;
	}
	for (const near of [track[lo - 1], track[lo]]) {
		if (!near) continue;
		if (near.ts === point.ts) return false;
		if (
			Math.abs(near.ts - point.ts) < 5000 &&
			near.lat === point.lat &&
			near.lon === point.lon
		) {
			return false;
		}
	}
	track.splice(lo, 0, point);
	return true;
}

export function dropOlderThan(track: TrackPoint[], cutoff: number) {
	while (track.length > 1 && track[0].ts < cutoff) track.shift();
}

export type PlaybackState = {
	lat: number;
	lon: number;
	base: TrackPoint;
	opacity: number;
	// Index of the last point at or before the playback cursor.
	index: number;
};

// Where the aircraft is at `cursor`: interpolated between the two beacons
// around it, or held at the last one and fading out once the track ends.
export function playbackAt(
	track: TrackPoint[],
	cursor: number,
): PlaybackState | null {
	let index = -1;
	for (let i = track.length - 1; i >= 0; i--) {
		if (track[i].ts <= cursor) {
			index = i;
			break;
		}
	}
	if (index < 0) return null;
	const base = track[index];
	const next = track[index + 1];
	if (next) {
		const span = next.ts - base.ts;
		const f = span > 0 ? (cursor - base.ts) / span : 0;
		return {
			lat: base.lat + (next.lat - base.lat) * f,
			lon: base.lon + (next.lon - base.lon) * f,
			base,
			opacity: 1,
			index,
		};
	}
	const opacity = 1 - (cursor - base.ts) / FADE_OUT_MS;
	if (opacity <= 0) return null;
	return { lat: base.lat, lon: base.lon, base, opacity, index };
}

// Degrees/minutes/seconds, the format rescue services and race officials use.
export function toDMS(decimal: number, isLat: boolean) {
	const hemi = decimal >= 0 ? (isLat ? "N" : "E") : isLat ? "S" : "W";
	const abs = Math.abs(decimal);
	let deg = Math.floor(abs);
	const minF = (abs - deg) * 60;
	let min = Math.floor(minF);
	let sec = Math.round((minF - min) * 60);
	if (sec === 60) {
		sec = 0;
		min += 1;
	}
	if (min === 60) {
		min = 0;
		deg += 1;
	}
	return `${String(deg).padStart(isLat ? 2 : 3, "0")}°${String(min).padStart(2, "0")}'${String(sec).padStart(2, "0")}"${hemi}`;
}

export function formatCoords(lat: number, lon: number) {
	return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}  ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
}

export function formatDuration(ms: number) {
	const s = Math.max(0, Math.round(ms / 1000));
	if (s < 60) return `${s}s`;
	if (s < 3600) {
		const m = Math.floor(s / 60);
		return `${m}m ${s - m * 60}s`;
	}
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatClock(ts: number) {
	const d = new Date(ts);
	return [d.getHours(), d.getMinutes(), d.getSeconds()]
		.map((n) => String(n).padStart(2, "0"))
		.join(":");
}

export function googleMapsUrl(lat: number, lon: number) {
	return `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`;
}
