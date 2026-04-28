import type { IGCFix } from "./igc-parser";
import type { TaskWaypoint } from "./tsk-parser";

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two GPS points in **meters**.
 */
function haversineM(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a)) * 1000;
}

export interface WaypointResult {
	/** Waypoint index (0-based) */
	index: number;
	name: string;
	type: string;
	reached: boolean;
	/** Distance from the closest fix to the waypoint center (meters) */
	closestDistanceM: number;
	/** Waypoint radius in meters */
	radiusM: number;
	/** Index of the fix that was closest */
	closestFixIndex: number | null;
}

export interface TrackValidationResult {
	valid: boolean;
	/** Short summary of why validation failed, or "OK" */
	summary: string;
	/** Per-waypoint details */
	waypoints: WaypointResult[];
}

/**
 * Validate an IGC track against a TSK task.
 *
 * Each task waypoint defines a circle (lat/lon center + radius in meters).
 * The track is valid if it passes through (or inside) every waypoint circle
 * **in order**. "In order" means the fix that touches waypoint N must come
 * before the fix that touches waypoint N+1.
 */
export function validateTrack(
	fixes: IGCFix[],
	waypoints: TaskWaypoint[],
): TrackValidationResult {
	const validFixes = fixes.filter((f) => f.valid);

	if (validFixes.length === 0) {
		return {
			valid: false,
			summary: "No valid GPS fixes in track",
			waypoints: waypoints.map((wp, i) => ({
				index: i,
				name: wp.name,
				type: wp.type,
				reached: false,
				closestDistanceM: Number.POSITIVE_INFINITY,
				radiusM: wp.radiusM,
				closestFixIndex: null,
			})),
		};
	}

	const results: WaypointResult[] = [];
	// Track from which fix index we start searching for the next waypoint
	let searchFromFix = 0;

	for (let wpIdx = 0; wpIdx < waypoints.length; wpIdx++) {
		const wp = waypoints[wpIdx];
		let closestDist = Number.POSITIVE_INFINITY;
		let closestIdx: number | null = null;
		let reachedFixIdx: number | null = null;

		// Scan fixes starting from the last reached waypoint's fix
		for (let fIdx = searchFromFix; fIdx < validFixes.length; fIdx++) {
			const fix = validFixes[fIdx];
			const dist = haversineM(fix.latitude, fix.longitude, wp.lat, wp.lon);

			if (dist < closestDist) {
				closestDist = dist;
				closestIdx = fIdx;
			}

			if (dist <= wp.radiusM && reachedFixIdx === null) {
				reachedFixIdx = fIdx;
			}
		}

		const reached = reachedFixIdx !== null;

		results.push({
			index: wpIdx,
			name: wp.name,
			type: wp.type,
			reached,
			closestDistanceM: Math.round(closestDist),
			radiusM: wp.radiusM,
			closestFixIndex: closestIdx,
		});

		if (reached && reachedFixIdx !== null) {
			// Next waypoint must be reached after this fix
			searchFromFix = reachedFixIdx;
		}
	}

	const missedWaypoints = results.filter((r) => !r.reached);
	const valid = missedWaypoints.length === 0;

	let summary: string;
	if (valid) {
		summary = "OK";
	} else {
		const missed = missedWaypoints
			.map(
				(w) =>
					`#${w.index + 1} "${w.name}" (closest: ${w.closestDistanceM}m, radius: ${w.radiusM}m)`,
			)
			.join("; ");
		summary = `Missed ${missedWaypoints.length}/${waypoints.length} waypoint(s): ${missed}`;
	}

	return { valid, summary, waypoints: results };
}
